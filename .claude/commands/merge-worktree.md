---
description: Merge worktree branch a main, borrar worktree + branch local
argument-hint: [worktree-path|branch-name]
allowed-tools: Bash(git:*), Bash(basename:*), Bash(pwd:*), Bash(realpath:*), AskUserQuestion
---

Cerrar worktree: `$ARGUMENTS`

Contexto:
- CWD: !`pwd`
- Branch actual: !`git branch --show-current`
- Worktrees: !`git worktree list`
- Status: !`git status --short`

Pasos:

1. **Resolver target worktree**:
   - Si `$ARGUMENTS` es path → usar directo.
   - Si es branch name → buscar en `git worktree list` su path.
   - Si vacío → AskUserQuestion listando worktrees (excluir el principal).
   - Si target = worktree principal → abortar.

2. **Validar estado del worktree**:
   ```bash
   git -C <path> status --short
   ```
   Si sucio → AskUserQuestion: commit pendiente / stash / abortar.

3. **Detectar branch del worktree**:
   ```bash
   git -C <path> branch --show-current
   ```
   Guardar como `$BRANCH`.

4. **Push + verificar remote** (si tiene upstream):
   ```bash
   git -C <path> push -u origin $BRANCH
   ```

5. **Estrategia merge** — AskUserQuestion:
   - **PR via gh** (recomendado): `gh pr create` desde worktree, luego merge remoto. No tocar main local.
   - **Merge local directo**: cambiar a main en repo principal, `git merge --no-ff $BRANCH`, push.
   - **Solo cerrar** (ya mergeado): skip merge, ir a paso 6.

6. **Verificar merged**:
   ```bash
   git branch --merged main | grep -w $BRANCH
   ```
   Si no aparece → abortar (no borrar branch no mergeada sin confirmación explícita).

7. **Cerrar worktree**:
   ```bash
   git worktree remove <path>
   ```
   Si falla por archivos sucios → AskUserQuestion antes de `--force`.

8. **Borrar branch local**:
   ```bash
   git branch -d $BRANCH
   ```
   `-d` no `-D` (rechaza si no mergeada).

9. **Borrar branch remoto** (opcional, preguntar):
   ```bash
   git push origin --delete $BRANCH
   ```

10. **Cleanup**: `git worktree prune`.

11. Output: branch mergeado a `<base>`, worktree `<path>` removido, branch local borrada. Confirmar remote estado.

Reglas:
- NUNCA `worktree remove --force` sin confirmar.
- NUNCA `branch -D` sin confirmar (usa `-d`).
- NUNCA borrar worktree principal.
- Si pre-commit/push hook falla → fix root cause, no `--no-verify`.
