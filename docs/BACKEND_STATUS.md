# Backend — estado, necesidad y opciones de hosting

Análisis: 2026-07-23. Contexto: crash de `timer-app-backend` en homelab por `SUPABASE_URL` faltante, y evaluación de dónde hostearlo mientras se configura Contabo VPS.

## ¿Qué tan necesario es el backend Go hoy?

**Nada necesario. El frontend no lo llama.**

- El frontend habla **directo con Supabase**: auth (`src/hooks/useAuth.js` → Google / magic link vía `src/lib/supabase.js`) y audio MP3s (Supabase Storage, `audioUtils.js` / `wimHofAudio.js`).
- Cero llamadas al backend Go desde `src/` — no existe `/api/`, ni URL de backend en ningún componente.
- Los handlers Go (`presets`, `progress`, `routines`, `social` en `backend/internal/handlers/`) están escritos y testeados pero **sin consumidor**.

Consecuencia: el crash del backend en homelab **no afecta a ningún usuario**. La PWA funciona completa sin él. Presión cero para arreglarlo.

## Alternativa a considerar antes de conectarlo

Mucho del backend (CRUD de presets/progress/routines) podría vivir **directo en Supabase** con Row Level Security + el client JS ya presente — sin backend propio. El Go se justifica si:

- lógica social compleja (feeds, rankings) que no conviene en RLS
- no querer depender de RLS para autorización

## Hosting actual

- **Frontend:** Vercel (proyecto linkeado en `.vercel/project.json`, deploy automático al pushear a `origin`/GitHub) + homelab vía Drone CI (`gitea` remote → `.103` → deploy en `.104`).
- **Backend:** solo homelab (`docker run` en `.104` vía pipeline `deploy-timer-app-backend` de `.drone.yml`). Actualmente crasheando por secrets de Drone faltantes (`supabase_url`, `supabase_service_key`, `supabase_jwt_secret`) — ver CURRENT.md.
- **Plan:** migrar a Contabo VPS (en configuración).

## Opciones de backend gratis (mientras se configura Contabo)

| Opción | Gratis | Trade-off |
|---|---|---|
| **Google Cloud Run** | 2M requests/mes, scale-to-zero | La mejor para container Go. Cold start ~1s. **Recomendada** |
| **Oracle Cloud Always Free** | VPS ARM 4 OCPU / 24 GB RAM, permanente | Literalmente un VPS gratis — mismo rol que Contabo. Registro engorroso |
| **Koyeb** | 1 instancia pequeña | Simple, deploy desde Docker/GitHub |
| **Render** | Web service free | Se duerme tras 15 min sin tráfico, cold start lento |
| Fly.io / Railway | Ya no tienen free tier real (2026) | Descartables |

**Recomendación:** no hostear nada todavía (backend sin consumidores). Al conectarlo:

- **Cloud Run** si sirve scale-to-zero — la imagen Docker ya existe (la construye el pipeline de Drone).
- **Oracle Always Free** si se quiere réplica del setup homelab/Contabo — docker + `docker run` idéntico al script de `.drone.yml`.
- En ambos casos: mismas 3 env vars de Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`). `mustEnv` en `backend/cmd/api/main.go` falla rápido si faltan (intencional, no tocar).
