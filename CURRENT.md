# CURRENT — HIIT & Tabata Timer

Última sesión: 2026-06-14

## En progreso

### E2E tests en CI/CD homelab (feature #17)

Playwright smoke tests en `.103` (cicd) post-deploy, apuntando a app en `.104:5177`. Branch: `e2e`. Ver `docs/E2E_CICD.md`.

**Estado:** `in-progress` según features.json — no mergeado a main todavía.

---

### Worktree agente activo: `worktree-agent-a9499cb4`

Path: `.claude/worktrees/agent-a9499cb4`

Contiene cambios experimentales (diverge mucho de main):
- C# Azure Functions backend con Supabase
- Prep phase + sounds antes de start/rest
- YouTube music + confetti al terminar
- Removed SW registration

**No mergeado.** Decidir si vale la pena rescatar algo antes de borrar.

## Completado recientemente (últimos commits a main)

- [x] feat(hiit): skip last rest, center confetti burst, add cheer sound (8032dbc)
- [x] feat(breathing): add rotating guidance to CalmingBreath + CI safety net (e1427ca)
- [x] Fix Dockerfile: `npm ci` en lugar de `npm install`
- [x] Fix drone.yml: backtick syntax en scripts
- [x] Migrar deploy a Traefik, eliminar port binding directo
- [x] Confirm before leaving active HIIT/Tabata timer
- [x] Wim Hof: audio ES + tests + i18n fixes

## Pendiente (próximos pasos inmediatos)

- [ ] **Push a origin** — main está 2 commits adelante de origin/main (8032dbc, e1427ca)
- [ ] Decidir qué hacer con worktree `agent-a9499cb4` — revisar/rescatar/borrar
- [ ] Fix circular progress rings — Pomodoro y Tabata (feature #3, `high` priority)
- [ ] Completar E2E tests en CI (feature #17, branch `e2e`)
- [ ] Wim Hof — conectar fases al sistema de ticks (feature #18, backlog)

## Notas

- Main está 2 commits adelante de origin — pendiente push/deploy.
- `features.json` es fuente de verdad para el backlog.
- Worktree agente en `.claude/worktrees/agent-a9499cb4` tiene cambios no mergeados (backend C#) — posiblemente descartable.
- Dead code candidato a borrar: `useAudioSync.js`, `useSeekControls.js`, `useTimerPersistence.js`, `useMouseTracking.js`, archivos `.backup` en `src/components/`.
