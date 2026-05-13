---
description: Crear nuevo git worktree aislado para feature/fix/experimento
argument-hint: [descripción tarea]
allowed-tools: Bash(git:*), Bash(basename:*), Bash(pwd:*), AskUserQuestion
---

Crear worktree para: `$ARGUMENTS`

Contexto:
- Repo path: !`pwd`
- Repo name: !`basename "$(git rev-parse --show-toplevel)"`
- Branch actual: !`git branch --show-current`
- Worktrees existentes: !`git worktree list`
- Branches existentes: !`git branch -a | head -30`

Pasos:

1. Si `$ARGUMENTS` vacío → usar AskUserQuestion para pedir descripción tarea.

2. Inferir tipo desde descripción:
   - "feature", "agregar", "nuevo", "implementar" → `feat`
   - "bug", "fix", "arreglar", "error" → `fix`
   - "experimento", "probar", "test", "spike" → `exp`
   - Ambiguo → AskUserQuestion (feat/fix/exp).

3. Generar slug kebab-case ≤4 palabras desde descripción (sin acentos, sin stopwords como "el/la/quiero/trabajar/en"). Ejemplo: "quiero trabajar en login con JWT" → `login-jwt`.

4. Branch name: `<tipo>/<slug>`. Verificar no exista: `git branch --list <tipo>/<slug>`. Si existe → sufijo `-2`, `-3`...

5. Directorio destino: `../<repo-name>-<tipo>-<slug>`. Verificar no exista path.

6. Ejecutar:
   ```bash
   git worktree add ../<repo-name>-<tipo>-<slug> -b <tipo>/<slug>
   ```
   Branch base = branch actual (o `main` si actual es detached).

7. Verificar: `git worktree list`.

8. Output al usuario:
   - Ruta absoluta worktree
   - Branch creada
   - Comando para abrir: `code <ruta>` o `zed <ruta>`
   - Comando para volver al worktree principal cuando termine: `git worktree remove <ruta>`

Reglas:
- No tocar worktree actual.
- No crear branch sobre `main` sin confirmar.
- Si working tree sucio, advertir pero permitir (worktrees son aislados).
