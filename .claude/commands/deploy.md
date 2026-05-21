---
description: Push a origin (Vercel) + gitea (Drone CI homelab) simultáneamente
allowed-tools: Bash(git:*), Bash(gh:*)
---

Deploy completo: pushea a `origin` (GitHub → Vercel) y `gitea` (Gitea → Drone CI → homelab).

Pasos:
1. Verificar branch limpio: !`git status --short`. Si hay cambios sin commit, abortar y avisar.
2. Branch actual: !`git branch --show-current`
3. Push a origin: `git push origin <branch>`
4. Push a gitea: `git push gitea <branch>`
5. Reportar resultado de ambos pushes.
6. Indicar qué pipeline se dispara en cada remote:
   - `origin` → Vercel (ver en https://vercel.com/dashboard)
   - `gitea` → Drone CI (ver en dashboard homelab)

Si `$ARGUMENTS` = "origin": solo pushear a origin (solo Vercel).
Si `$ARGUMENTS` = "gitea": solo pushear a gitea (solo Drone).
Si `$ARGUMENTS` = "all" o vacío: pushear a ambos.

No force-push. No --no-verify.
