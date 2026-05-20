---
description: Build producción + servir preview local
allowed-tools: Bash(npm:*), Bash(lsof:*), Read
---

Build de producción y arrancar preview local para validar antes de deploy.

Pasos:
1. Verificar branch limpio: !`git status --short`
2. Si hay cambios sin commit, avisar y preguntar antes de seguir.
3. Build: `npm run build`. Si falla, mostrar error, no continuar.
4. Reportar tamaño del bundle: !`du -sh dist 2>/dev/null && ls -lh dist/assets/*.js dist/assets/*.css 2>/dev/null | head -20`
5. Arrancar preview en background: `npm run preview`
6. Reportar URL local (típicamente http://localhost:4173).
7. Recordatorio: validar manualmente HIIT timer + sync MP3 antes de push a `main`/`release` (Drone autodespliega).

Si `$ARGUMENTS` = "ship": después de preview OK, sugerir comando `git push origin main` (no ejecutar sin confirmación).
