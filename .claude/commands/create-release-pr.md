---
description: Crear release PR desde branch actual hacia main
argument-hint: [version]
allowed-tools: Bash(git:*), Bash(gh:*), Bash(jq:*), Read, Edit
---

Crear release PR versión `$1`.

Validaciones previas:
1. Branch limpio: !`git status --short`
2. Branch actual: !`git branch --show-current`. Si es `main`, abortar — crear branch primero.
3. Último tag: !`git describe --tags --abbrev=0 2>/dev/null || echo "sin tags"`
4. Commits desde último tag: !`git log $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD --oneline`

Pasos:
1. Si arg `$1` vacío, pedir versión (formato semver `v1.2.3`).
2. Crear branch `release/$1` si no estamos ya en uno.
3. Bump `version` en `package.json` con Edit.
4. Bump versión en `backend/` si tiene archivo de versión (revisar `backend/internal/api/` o `main.go`).
5. Commit: `chore(release): $1`
6. Push: `git push -u origin release/$1`
7. Generar changelog agrupando commits por tipo (feat/fix/chore/test/docs).
8. Abrir PR a `main` con `gh pr create`:
   - Título: `chore(release): $1`
   - Body: changelog + checklist de validación (HIIT sync MP3 OK, Tabata OK, build pasa, tests pasan).
9. Retornar URL del PR.

No force-push. No skip hooks. Si pre-commit falla, fix root cause.
