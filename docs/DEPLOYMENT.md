# Deployment Architecture

## Remotes y pipelines

Este repo tiene **dos remotes** y **dos pipelines independientes**:

| Remote | URL | Trigger | Pipeline | Output |
|--------|-----|---------|----------|--------|
| `origin` | github.com/MarioAraya/timer-app | `git push origin` | **Vercel** (GitHub App) | Frontend público en `*.vercel.app` |
| `gitea` | 192.168.0.103:3000/maaya/timer-app | `git push gitea` | **Drone CI** (`.drone.yml`) | Docker → homelab `https://timers.lab` |

Un `push` a `origin` **no** dispara Drone. Un `push` a `gitea` **no** dispara Vercel. Son completamente independientes.

## Vercel

### Cómo funciona

Vercel tiene instalada una **GitHub App** en el repo. No usa GitHub Actions — no hay `.github/workflows/`. El trigger es un webhook que GitHub envía a Vercel directamente.

### Dónde ver el webhook en GitHub

```
github.com/MarioAraya/timer-app → Settings → Webhooks
```

Aparece una entrada con URL tipo `https://api.vercel.com/v1/integrations/deploy/...`

### Qué rama despliega dónde

| Branch | Environment | URL |
|--------|-------------|-----|
| `main` | Production | URL principal del proyecto |
| cualquier otra | Preview | URL única por deployment |

### Ver deployments

- Dashboard: https://vercel.com/dashboard → timer-app → Deployments
- Commit status: cada push a GitHub muestra ✅/❌ en el commit (checks de GitHub)

## Drone CI (homelab)

### Cómo funciona

`.drone.yml` en la raíz del repo. Gitea tiene un webhook hacia el servidor Drone.

### Pipeline

```
push a gitea (main o release)
    │
    ├── step: build-and-push
    │   imagen Docker → registro local 192.168.0.103:5000
    │
    └── step: deploy (SSH a 192.168.0.104)
        → docker pull latest
        → docker stop/rm timer-app
        → docker run con labels Traefik
        → disponible en https://timers.lab (red local)
```

### Ver runs

Drone dashboard en tu homelab (puerto donde corre Drone en 192.168.0.103 o .104).

## Slash commands disponibles

| Comando | Qué hace |
|---------|----------|
| `/deploy-preview` | Build prod local + servidor preview en localhost:4173 |
| `/deploy` | Push a `origin` (Vercel) + `gitea` (Drone) simultáneamente |
| `/create-release-pr <version>` | Crea branch `release/vX.Y.Z`, bump version, PR a main con changelog |

## Flujo típico

### Deploy rápido (solo frontend público)
```bash
git push origin main
# Vercel despliega automáticamente (~11s según logs)
```

### Deploy completo (Vercel + homelab)
```
/deploy
```

### Release con versión
```
/create-release-pr v1.2.3
# crea PR → al mergear a main → ambos pipelines se disparan si pusheas a ambos remotes
```

## Scripts en `../1_Scripts/`

| Script | Propósito |
|--------|-----------|
| `setup-remotes.sh` | Configura los dos remotes (origin + gitea) en repos nuevos |
| `setup-https.sh` | Configura HTTPS en homelab |
| `setup-traefik.sh` | Configura Traefik reverse proxy |
| `create-gitea-repos.sh` | Crea repos en Gitea homelab |
