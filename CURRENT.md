# CURRENT — HIIT & Tabata Timer

Última sesión: 2026-06-19

## En progreso

### Worktree agente activo: `worktree-agent-a9499cb4`

Path: `.claude/worktrees/agent-a9499cb4`

Contiene cambios experimentales (diverge mucho de main):
- C# Azure Functions backend con Supabase
- Prep phase + sounds antes de start/rest
- YouTube music + confetti al terminar
- Removed SW registration

**No mergeado.** Decidir si vale la pena rescatar algo antes de borrar.

---

### E2E tests en CI/CD homelab (feature #17)

Playwright smoke tests en `.103` (cicd) post-deploy, apuntando a app en `.104:5177`. Branch: `e2e`.

**Estado:** `in-progress` según features.json — no mergeado a main todavía.

## Completado esta sesión

- [x] fix: `hiit.exercises` mostraba clave literal en vez del array — `t()` rechazaba arrays (`typeof [] === 'object'`). Fix en `src/i18n/index.js:22` (656f4aa)
- [x] fix: Reset race condition en HIIT y Tabata — RAF en vuelo podía disparar `handlePhaseComplete()` después del reset antes del re-render de Preact. Fix: `timerRef.current` almacena RAF ID activo, `handleReset` llama `cancelAnimationFrame` síncronamente. (656f4aa)
- [x] Deploy a Vercel (origin) y Drone CI (gitea) — ambos OK, Vercel `state: success`

## Pendiente (próximos pasos inmediatos)

- [ ] Decidir qué hacer con worktree `agent-a9499cb4` — revisar/rescatar/borrar
- [ ] Fix circular progress rings — Pomodoro y Tabata (feature #3, `high` priority)
- [ ] Completar E2E tests en CI (feature #17, branch `e2e`)
- [ ] Wim Hof — conectar fases al sistema de ticks (feature #18, backlog)

## Notas

- `main` sincronizado con origin y gitea (656f4aa).
- Tests `useLanguage.test.js` tienen 3 fallos pre-existentes (no introducidos por esta sesión — verificado con `git stash`).
- `features.json` es fuente de verdad para el backlog.
- Dead code candidato a borrar: `useAudioSync.js`, `useSeekControls.js`, `useTimerPersistence.js`, `useMouseTracking.js`, archivos `.backup` en `src/components/`.
