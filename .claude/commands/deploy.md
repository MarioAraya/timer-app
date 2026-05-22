---
description: Push a origin (Vercel) + gitea (Drone CI homelab) simultáneamente
allowed-tools: Bash(git:*), Bash(gh:*)
---

Deploy the app to the homelab via Drone CI pipeline.

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

1. Run `git status --short`. Si hay cambios sin commit:
   - If argument includes `--add` or `-a`, stage everything with `git add -A` then commit
   - Otherwise, tell the user what's uncommitted and ask if they want to commit before deploying, then stop
   - Commit message should follow Conventional Commits, no AI attribution, no emoji unless already in git log

2. **Check the current branch:**
   - Run `git branch --show-current`
   - If not on `release` or `main`, warn the user — the pipeline only triggers on those branches. Ask if they want to continue.

3. **Push según `$ARGUMENTS`:**
   - `origin` → solo pushear a origin (GitHub → Vercel)
   - `gitea` → solo pushear a gitea (Gitea → Drone CI → homelab)
   - `all` o vacío → pushear a ambos

   ```bash
   git push gitea HEAD   # triggers Drone CI
   git push origin HEAD  # triggers Vercel
   ```
   Push `gitea` first. If `origin` fails (e.g. no access), warn but don't abort.

4. **Confirm and summarize:**
   - Show the commit SHA that was pushed
   - Confirm which remotes succeeded
   - Indicar qué pipeline se dispara:
     - `gitea` → Drone CI (ver en http://192.168.0.103)
     - `origin` → Vercel (ver en https://vercel.com/dashboard)

## Notes
- The pipeline does: `npm run build` inside Docker → push image to local registry → SSH pull & `docker compose up -d --force-recreate frontend`
- If the pipeline already ran for the latest commit (nothing new to push), say so — a manual trigger is needed from the Drone UI using the "custom" event trigger
- No force-push. No --no-verify.

Argument passed to this command: $ARGUMENTS
