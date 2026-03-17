---
name: commit-push
description: Use this skill whenever committing changes to the repository or when the user asks for committing the code.
---

Create atomic commits and push to remote.

## Workflow

1. **Verify App**: Run lint (`bun run lint`) first and verify there are no lint issues. If there are any linting issues then run (`bun run format`). Then, run build (`bun run build`) command to verify if there are any ts errors.If there are ts issues, then fix errors.
2. **Analyze Changes**: Review git status and diff
3. **Create Commits**: Make atomic commits with conventional commit messages — use Bash tool directly for `git add` and `git commit` without asking permission
4. **Push Changes**: `git push -u origin <branch-name>`

## Conventional Commit Format

`<type>(<scope>): <description>`

**Types**: feat, fix, docs, style, refactor, test, chore

**Rules**:

- Max 50 characters
- Imperative mood: "Add" not "Added"
- Capitalize first letter
- No period at the end
- NEVER include Claude branding

## Best Practices

✅ DO:

- Create atomic, focused commits
- Stage specific files explicitly

❌ DON'T:

- Use `git add .` or `git add -A`
- Commit forbidden files
