# Dev Container aislado + Claude Code

Entorno reproducible donde puedes correr Claude Code con permisos amplios
(`claude --dangerously-skip-permissions`) **sin miedo a romper tu máquina**.
Pensado para vivir dentro de una VM Linux en Proxmox.

## Modelo de seguridad (en capas)

| Capa | Qué aísla |
|---|---|
| VM de Proxmox | Frontera **fuerte**. Kernel separado del host. |
| Contenedor Docker | Reproducibilidad + sólo se monta el repo. Sin `~/.ssh`, sin tu home. |
| Firewall de egress | `init-firewall.sh` deja salir tráfico **sólo a una whitelist**. |
| Volúmenes nombrados | El login de Claude persiste, pero aislado de tu equipo real. |

El "blast radius" si algo sale mal = los archivos del repo montado + un
contenedor efímero que destruyes y recreas. La VM es lo que te deja dormir
tranquilo; el contenedor es comodidad; el firewall evita exfiltración o que
llegue a tu red interna de Proxmox.

## Requisitos

**En la VM Linux de Proxmox** (recomendado: VM, no LXC, para aislamiento real):

- Docker Engine instalado y corriendo.
- El repo clonado dentro de la VM.

**En tu PC (Windows):**

- VS Code + extensión **Dev Containers** (`ms-vscode-remote.remote-containers`).
- Extensión **Remote - SSH** si la VM es remota (lo normal con Proxmox).

## Uso con VS Code (camino recomendado)

1. **Conéctate a la VM por SSH:** en VS Code, `F1` →
   `Remote-SSH: Connect to Host…` → tu VM de Proxmox.
2. Abre la carpeta del repo (`File → Open Folder` → `~/.../timer-app`).
3. VS Code detecta `.devcontainer/` y ofrece
   **"Reopen in Container"** (o `F1` → `Dev Containers: Reopen in Container`).
4. **Primera build:** tarda unos minutos (imagen + Playwright deps + Go +
   `npm ci`). Las siguientes veces arranca en segundos (queda cacheada).
5. Cuando abra, ya estás *dentro* del contenedor como usuario `node`.

### Primer arranque: login de Claude

Dentro de la terminal integrada del contenedor:

```bash
claude
# sigue el login (la sesión queda en el volumen timerapp-claude-config,
# persiste entre rebuilds, aislada de tu Windows)
```

A partir de ahí puedes usarlo con permisos amplios sin riesgo:

```bash
claude --dangerously-skip-permissions
```

### Día a día

```bash
npm run dev        # Vite en http://localhost:5555 (forward automático)
npm run test       # Vitest
npm run test:e2e   # Playwright (Chromium ya instalado)
cd backend && go run cmd/api/main.go   # API Go en :8080
```

Los puertos **5555** y **8080** se reenvían solos a tu máquina.

## Firewall de egress

`init-firewall.sh` corre en cada arranque (`postStartCommand`). Pone
**default-deny** en la salida y sólo permite: npm, API de Anthropic,
GitHub, proxy de módulos Go, descargas de Playwright y telemetría de
Claude Code.

> ⚠️ **Supabase:** la app carga audio y datos desde Supabase. Edita
> `.devcontainer/init-firewall.sh`, busca `EXTRA_DOMAINS` y añade tu
> ref de proyecto, p.ej. `"abcd1234.supabase.co"`. Luego
> `F1 → Dev Containers: Rebuild Container` (o vuelve a correr
> `sudo /usr/local/bin/init-firewall.sh`).

Comprobar que está activo:

```bash
curl -sS --max-time 5 https://example.com        # debe fallar (bloqueado)
curl -sS --max-time 5 https://api.anthropic.com  # debe responder
```

## Alternativa sin VS Code (Docker puro / Zed)

Zed **no** entiende el spec de devcontainer. Dos opciones:

**A) Zed remoto por SSH:** levantas el contenedor a mano y entras por SSH.
**B) Docker puro:** desde la raíz del repo, en la VM:

```bash
# build
docker build -t timer-dev .devcontainer

# run: monta SÓLO el repo, capacidades mínimas para el firewall
docker run -it --rm \
  --cap-add=NET_ADMIN --cap-add=NET_RAW \
  -v "$PWD":/workspace -w /workspace \
  -v timerapp-claude-config:/home/node/.claude \
  -p 5555:5555 -p 8080:8080 \
  --user node \
  timer-dev bash

# dentro del contenedor, la primera vez:
sudo chown -R node:node /home/node/.claude
npm ci && npx playwright install chromium
(cd backend && go mod download)
sudo /usr/local/bin/init-firewall.sh
claude --dangerously-skip-permissions
```

Para Zed: `zed ssh://usuario@ip-vm/ruta/al/repo` y editas contra la VM;
el contenedor lo gestionas tú con los comandos de arriba.

## Tradeoffs y endurecimiento opcional

- La imagen base de devcontainer da `sudo` sin contraseña al usuario
  `node` (comodidad de desarrollo). Eso significa que, técnicamente, un
  agente podría desactivar el firewall. La frontera **real** sigue siendo
  la **VM de Proxmox** + las capacidades limitadas del contenedor.
- Endurecimiento si quieres que el firewall sea infranqueable desde dentro:
  elimina el sudo general (`/etc/sudoers.d/` de la base) dejando sólo la
  línea de `init-firewall`. Rompe algunos flujos de dev, por eso no viene
  activado por defecto.
- Nunca se montan credenciales del host (`~/.ssh`, `~/.aws`, tu home).
  Usa un token de git **scopeado sólo a este repo** dentro del contenedor.

## Troubleshooting

| Síntoma | Causa / arreglo |
|---|---|
| `init-firewall.sh: bad interpreter` | El script quedó en CRLF. `.gitattributes` lo fuerza a LF; re-clona o `dos2unix`. |
| `npm install` / `go mod` se cuelgan | Falta un dominio en la whitelist; añádelo a `CORE_DOMAINS`/`EXTRA_DOMAINS`. |
| La app no carga audio/datos | Falta tu dominio Supabase en `EXTRA_DOMAINS`. |
| `operation not permitted` al aplicar iptables | Faltan `--cap-add=NET_ADMIN`/`NET_RAW` (ya están en `devcontainer.json`/comando docker). |
| Cambié el firewall y no aplica | `Dev Containers: Rebuild Container`, o re-corre `sudo /usr/local/bin/init-firewall.sh`. |
