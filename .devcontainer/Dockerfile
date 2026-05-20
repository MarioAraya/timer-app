# Base: Microsoft's devcontainer Node image (Debian bookworm).
# Gives us a non-root `node` user, sudo, git, oh-my-zsh and devcontainer glue.
FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# --- System packages: egress-firewall tooling + utilities ---
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends \
        iptables \
        ipset \
        dnsutils \
        jq \
        curl \
        ca-certificates \
        sudo \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# --- Playwright system libraries for Chromium ---
# Browser *binaries* are installed per-user in postCreate so their version
# always matches the @playwright/test pinned in package.json.
RUN npx -y playwright@1.52.0 install-deps chromium

# --- Claude Code CLI (global) ---
RUN npm install -g @anthropic-ai/claude-code

# --- Egress firewall script ---
COPY init-firewall.sh /usr/local/bin/init-firewall.sh
RUN chmod 0755 /usr/local/bin/init-firewall.sh \
    && echo "node ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh" \
        > /etc/sudoers.d/init-firewall \
    && chmod 0440 /etc/sudoers.d/init-firewall

# Pre-create the dirs backed by named volumes, owned by the node user.
RUN mkdir -p /home/node/.claude /home/node/.cache/ms-playwright /commandhistory \
    && chown -R node:node /home/node/.claude /home/node/.cache /commandhistory

ENV PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright
