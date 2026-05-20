Suggest a git commit message in English by analyzing current git state.

Steps:
1. Run `git status` to see staged and modified files
2. Run `git diff --staged` to see staged changes
3. If nothing is staged, also run `git diff` to see unstaged changes
4. Analyze all changes together and infer intent
5. Output a single commit message in English following Conventional Commits format

Rules:
- **Always write in English** — no exceptions
- Output ONLY the raw commit message string, nothing else — no explanation, no backticks, no preamble
- Conventional Commits format: `type(scope): short description` — max 72 chars
- Imperative mood: "add", "fix", "remove" — not "added"
- Add a body paragraph only when the *why* is non-obvious (separated by blank line)
- No "Co-authored-by" or AI attribution
- No emoji unless the project's git log already uses them
- If there is nothing to commit, say so and stop
