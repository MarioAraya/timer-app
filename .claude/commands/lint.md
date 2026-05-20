---
description: Lint frontend + backend, fix automático
allowed-tools: Bash(npm:*), Bash(npx:*), Bash(go:*), Bash(gofmt:*), Edit, Read
---

Correr linters de frontend (eslint si existe) y backend Go (`go vet`, `gofmt`).

Pasos:

**Frontend:**
1. Detectar script: !`cat package.json | grep -A1 '"scripts"' | head -30`
2. Si existe `lint`: `npm run lint`. Si no, intentar `npx eslint src --max-warnings 0`.
3. Si errores auto-fijables: `npx eslint src --fix`.
4. Si errores manuales: leer, fix con Edit, re-correr.

**Backend Go** (si `$ARGUMENTS` incluye `backend` o vacío = ambos):
1. `cd backend && go vet ./...`
2. `cd backend && gofmt -l .` → si lista archivos: `gofmt -w .`
3. Si `go vet` falla, no auto-fix. Mostrar error, proponer fix.

Reportar: archivos modificados, errores restantes, exit code.

No tocar archivos fuera del scope del lint. No agregar `eslint-disable` para silenciar errores reales.
