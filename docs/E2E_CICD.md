# E2E Testing en CI/CD (Homelab)

## Estado: in-progress (branch `e2e`)

## Lo que ya existe

- `e2e/timer.spec.js` — ~20 tests Playwright (HIIT, Tabata, MP3, navegación)
- `Dockerfile.e2e` — imagen basada en `mcr.microsoft.com/playwright:v1.44.0-jammy`
- `playwright.config.js` — soporta `BASE_URL` env var; en CI no levanta webServer

## Arquitectura

```
push → main
  build-and-push  →  imagen app en registry 192.168.0.103:5000
  deploy          →  app corriendo en 192.168.0.104:5177
  e2e-smoke       →  Playwright en .103 apunta a .104:5177
```

## Pendiente para que funcione en CI

### 1. Mergear branch `e2e` → `main`
Los archivos `Dockerfile.e2e`, `.drone.yml` (con step `e2e-smoke`) y `playwright.config.js` están en branch `e2e`.

### 2. Buildear imagen Playwright en `.103` (una vez)
```bash
# Copiar archivos a .103
scp Dockerfile.e2e package.json package-lock.json playwright.config.js \
    maaya@192.168.0.103:~/playwright-e2e/
scp -r e2e/ maaya@192.168.0.103:~/playwright-e2e/

# Buildear y pushear desde .103 (es x86, no necesita --platform)
ssh maaya@192.168.0.103 "
  cd ~/playwright-e2e &&
  docker build -f Dockerfile.e2e -t 192.168.0.103:5000/maaya/playwright-e2e:latest . &&
  docker push 192.168.0.103:5000/maaya/playwright-e2e:latest
"
```

### 3. Verificar insecure registry en `.103`
El registry en `.103:5000` es HTTP. Drone necesita poder pullear sin TLS:
```bash
# SSH a .103 y verificar/agregar:
cat /etc/docker/daemon.json
# debe tener: { "insecure-registries": ["192.168.0.103:5000"] }
# Si no está: agregar y reiniciar docker
sudo systemctl restart docker
```

### 4. (Opcional) Notificaciones si falla
Opción A — Email: Drone UI → Settings → Notifications  
Opción B — Telegram: agregar step `appleboy/drone-telegram` con secrets `telegram_token` + `telegram_chat_id`

## Cuándo re-buildear la imagen e2e
Solo si cambia: `Dockerfile.e2e`, `package.json`, o archivos en `e2e/`.  
Cambios de app (`.jsx`, `.scss`) NO requieren re-build de imagen.

## Notas
- Mac M1 usa Colima (no Docker Desktop) → no tiene `buildx` → buildear siempre en `.103`
- Puerto app en dev-docker: `:5177` (nginx sirve la build de producción)
- Tests corren solo Chromium headless, sin retries en local, 1 retry en CI
