# CURRENT — HIIT & Tabata Timer

Última sesión: 2026-07-22

## En progreso

### Crash de `timer-app-backend`: falta `SUPABASE_URL`

Backend Go crashea al arrancar en el homelab por falta de `SUPABASE_URL`.

**Contexto recopilado:**
- `backend/cmd/api/main.go:22` — `supabaseURL := mustEnv("SUPABASE_URL")`. `mustEnv` hace `log.Fatal` si la var no está seteada → el proceso muere, Docker lo reinicia en loop (`--restart unless-stopped`).
- `.drone.yml` pipeline `deploy-timer-app-backend` (steps `build-and-push` + `deploy`) ya está bien cableada en el código:
  - `deploy` step trae `environment: { SUPABASE_URL: from_secret: supabase_url, ... }` (también `supabase_service_key`, `supabase_jwt_secret`)
  - `envs: [SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_JWT_SECRET]` le dice al plugin `appleboy/drone-ssh` que exporte esas vars al script remoto
  - el script hace `docker run ... -e SUPABASE_URL="$SUPABASE_URL" ...` — correcto
- Conclusión: el `.drone.yml` no es el problema. Si el container crashea por falta de la var, lo más probable es que los **secrets de Drone** (`supabase_url`, `supabase_service_key`, `supabase_jwt_secret`) no estén cargados en el store de Drone del homelab (server en `.103`/`.104`) — o tengan otro nombre.
- No verificable desde este repo: los secrets viven en el servidor Drone, no en el código.

**Decisiones tomadas:** ninguna aún — solo diagnóstico, no se tocó código ni pipeline.

**Preguntas pendientes antes de continuar:**
1. ¿Están cargados los secrets `supabase_url`, `supabase_service_key`, `supabase_jwt_secret` en Drone (UI o `drone secret ls --repo maaya/timer-app`)? Si no existen o tienen otro nombre, ese es el fix.
2. Si existen y aun así crashea: revisar logs del container (`docker logs timer-app-backend` en `.104`) para confirmar que el error es justo `SUPABASE_URL` y no otra de las tres vars.

## Completado esta sesión

- Diagnóstico del crash del backend (sin cambios de código commiteados)
- i18n de vistas activas: Pomodoro, HIIT/Tabata (`WorkoutActiveView`), breathing timers — strings hardcodeados migrados a `t()`, claves nuevas en `en.js`/`es.js`, `pomodoroConfig.js` con dot-keys
- Fix feature #25: estado "Complete" ya no se restaura al reentrar a HIIT/Tabata
- Fix feature #11 (parcial): música se pausa al salir del timer, posición se conserva para resume. Falta el badge "Now Playing" en la card de home descrito en features.json
- Tests: `BreathingTimer.test.jsx` mockea `useLang` (forzado a `en`); `useLanguage.test.js` stubea `navigator` para ser determinista + test nuevo de detección `es`
- `features.json`: #11 y #25 → `done`

## Pendiente (próximos pasos inmediatos)

- [ ] Verificar/crear secrets de Drone: `supabase_url`, `supabase_service_key`, `supabase_jwt_secret`
- [ ] Confirmar en `.104` con `docker logs timer-app-backend` cuál var falta exactamente
- [ ] Identificar entorno remoto que corre `npm ci` como root y por qué resuelve `esbuild@0.28.1` en vez de `0.27.0` pinneado
- [ ] Considerar agregar `.nvmrc` / `engines` en `package.json` para fijar versión de node/npm y evitar drift entre entornos
- [ ] Feature #11 resto: badge "Now Playing" en la card del timer en home
- [ ] Fix circular progress rings — Pomodoro y Tabata (feature #3, `high`)
- [ ] HIIT circular progress rings deben animar clockwise (feature #23, `high`)
- [ ] Completar E2E tests en CI (feature #17, branch `e2e`)

## Notas

- `main` adelantado a `origin/main` por 4 commits (sin pushear al momento de este wrap).
- `mustEnv` no tiene fallback/default — es intencional (falla rápido en vez de arrancar mal configurado), no tocar sin discutirlo.
- `features.json` sigue siendo fuente de verdad para el backlog — sin cambios esta sesión.
- Dead code candidato a borrar (sin confirmar si sigue vigente): `useAudioSync.js`, `useSeekControls.js`, `useTimerPersistence.js`, `useMouseTracking.js`, archivos `.backup` en `src/components/`.
