Analyze the current git state and create a commit.

Steps:
1. If the argument is `--add` or `-a`, run `git add .` first
2. Run `git status` and `git diff --staged` to understand what's changing
3. Infer a commit message following Conventional Commits. Subject ≤72 chars, imperative mood. Add a body only when the why is non-obvious.
4. Run the commit using a heredoc to avoid shell quoting issues:

```bash
git commit -m "$(cat <<'EOF'
<subject line here>

<optional body here>
EOF
)"
```

Rules for the commit message:
- No "Co-authored-by" or any AI attribution — not even as a trailer
- No emoji unless already used in the project's git log
- Imperative mood: "add", "fix", "remove" — not "added"

If there is nothing staged and `--add` was not passed, tell the user and stop.

Argument passed to this command: $ARGUMENTS
