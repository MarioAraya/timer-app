Analyze the current git state and create a commit.

Steps:
1. If the argument is `--add` or `-a`, run `git add .` first
2. Run `git status` and `git diff --staged` to understand what's changing
3. Infer a concise commit message following Conventional Commits (type: short description). Types: feat, fix, refactor, style, docs, test, chore. Max 72 chars on first line.
4. Run `git commit -m "<message>"` using the inferred message

Rules for the commit message:
- No "Co-authored-by" or any AI attribution lines
- No trailing blank lines or metadata beyond the subject line unless a body is truly needed
- Use imperative mood ("add", "fix", "update"), not past tense
- Do not wrap in backticks or quotes when passing to git

If there is nothing staged and `--add` was not passed, tell the user and stop.

Argument passed to this command: $ARGUMENTS
