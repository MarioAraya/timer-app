Suggest a git commit message for the current staged changes.

Steps:
1. Run `git status` and `git diff --staged` (if nothing staged, also run `git diff` to see unstaged changes)
2. Analyze what changed and why
3. Output a single commit message following Conventional Commits (type: short description). Max 72 chars. Imperative mood.

Rules:
- No "Co-authored-by" or any AI attribution
- No explanation around the message — output only the raw commit message string, ready to copy-paste
- If there is nothing to commit, say so
