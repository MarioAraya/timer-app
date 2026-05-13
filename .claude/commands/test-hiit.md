---
description: Correr tests vitest de HIIT
allowed-tools: Bash(npx:*), Bash(npm:*), Read, Edit
---

Correr suite de tests relacionada al timer HIIT.

Pasos:
1. Localizar tests HIIT: !`find src -type f \( -name "*hiit*.test.*" -o -path "*hiit*" -name "*.test.*" \) 2>/dev/null`
2. Correr vitest sobre esos archivos: `npx vitest run <paths>`
3. Si arg `$ARGUMENTS` no vacío, pasar como filtro adicional (`-t "$ARGUMENTS"`)
4. Si fallan tests: leer error, identificar causa raíz (no parchear test sin entender). Reportar diagnóstico antes de fix.
5. Verificar también `src/utils/ticksEngine.test.js` si existe (HIIT depende de ticks).

Reportar: total pass/fail, archivos cubiertos, tiempo total.
