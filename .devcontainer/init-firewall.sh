#!/bin/bash
# Egress firewall: default-deny outbound, allow only a whitelist.
# Runs as root (via sudoers) on every container start.
set -euo pipefail
IFS=$'\n\t'

# --------------------------------------------------------------------------
# Project-specific hosts. Add your Supabase project ref here so the dev
# server and tests can reach it, e.g. "abcd1234.supabase.co".
# --------------------------------------------------------------------------
EXTRA_DOMAINS=(
  # "YOUR-PROJECT-REF.supabase.co"
)

CORE_DOMAINS=(
  registry.npmjs.org          # npm install
  api.anthropic.com           # Claude Code API
  sentry.io                   # Claude Code telemetry
  statsig.anthropic.com       # Claude Code feature flags
  statsig.com
  proxy.golang.org            # go mod download
  sum.golang.org
  storage.googleapis.com      # go module zips / Supabase storage CDN
  objects.githubusercontent.com
  cdn.playwright.dev          # Playwright browser downloads
  playwright.azureedge.net
)

echo "[firewall] flushing existing rules…"
iptables -F
iptables -X
iptables -t nat -F 2>/dev/null || true
iptables -t mangle -F 2>/dev/null || true
ipset destroy allowed-domains 2>/dev/null || true

# Allow DNS + loopback BEFORE lockdown so we can resolve the whitelist.
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A INPUT  -p udp --sport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT
iptables -A INPUT  -p tcp --sport 53 -j ACCEPT
iptables -A INPUT  -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow git/ssh out (git over ssh, zed remote, etc.)
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT

ipset create allowed-domains hash:net

echo "[firewall] adding GitHub IP ranges…"
gh_ranges=$(curl -s --max-time 10 https://api.github.com/meta || echo '{}')
echo "$gh_ranges" \
  | jq -r '(.web // []) + (.api // []) + (.git // []) | .[]' 2>/dev/null \
  | grep -v ':' \
  | while read -r cidr; do
      [ -n "$cidr" ] && ipset add allowed-domains "$cidr" 2>/dev/null || true
    done

echo "[firewall] resolving whitelisted domains…"
for domain in "${CORE_DOMAINS[@]}" "${EXTRA_DOMAINS[@]}"; do
  [ -z "$domain" ] && continue
  for ip in $(dig +short A "$domain" 2>/dev/null); do
    if [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      ipset add allowed-domains "$ip" 2>/dev/null || true
    fi
  done
done

# Allow the Docker bridge / host subnet so VSCode server + port-forward work.
HOST_IP=$(ip route | awk '/default/ {print $3; exit}')
if [ -n "${HOST_IP:-}" ]; then
  HOST_NET=$(echo "$HOST_IP" | sed 's/\.[0-9]*$/.0\/24/')
  iptables -A INPUT  -s "$HOST_NET" -j ACCEPT
  iptables -A OUTPUT -d "$HOST_NET" -j ACCEPT
fi

# Keep established connections alive.
iptables -A INPUT  -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow traffic to the whitelist.
iptables -A OUTPUT -m set --match-set allowed-domains dst -j ACCEPT

# Default: drop everything else.
iptables -P INPUT DROP
iptables -P OUTPUT DROP
iptables -P FORWARD DROP

# --- Sanity checks ---
if curl -s --max-time 5 https://example.com >/dev/null 2>&1; then
  echo "[firewall] ERROR: leak detected — example.com is reachable" >&2
  exit 1
fi
if ! curl -s --max-time 5 -o /dev/null https://api.anthropic.com; then
  echo "[firewall] WARNING: api.anthropic.com unreachable through firewall" >&2
fi

echo "[firewall] active — outbound restricted to whitelist."
