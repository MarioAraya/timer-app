Deploy the app to the homelab via Drone CI pipeline.

## Setup
- Registry: 192.168.0.103:5000/maaya/timer-app
- Deploy host: 192.168.0.104 (docker compose service: frontend)
- Pipeline triggers automatically on push to `release` or `main`

## Steps

1. Run `git status` and `git diff HEAD` to see what's pending.

2. **If there are unstaged/uncommitted changes:**
   - If argument is `--add` or `-a`, stage everything with `git add -A` then commit
   - Otherwise, tell the user what's uncommitted and ask if they want to commit before deploying, then stop
   - Commit message should follow Conventional Commits, no AI attribution, no emoji unless already in git log

3. **Check the current branch:**
   - Run `git branch --show-current`
   - If not on `release` or `main`, warn the user — the pipeline only triggers on those branches. Ask if they want to continue.

4. **Push to remote:**
   ```bash
   git push origin HEAD
   ```

5. **Confirm and summarize:**
   - Show the commit SHA that was pushed
   - Remind the user that Drone CI will now build and deploy automatically
   - Suggest checking the Drone UI at http://192.168.0.103 (or wherever Drone runs) if the deploy doesn't appear within a few minutes

## Notes
- The pipeline does: `npm run build` inside Docker → push image to local registry → SSH pull & `docker compose up -d --force-recreate frontend`
- If the pipeline already ran for the latest commit (nothing new to push), say so — a manual trigger is needed from the Drone UI using the "custom" event trigger

Argument passed to this command: $ARGUMENTS
