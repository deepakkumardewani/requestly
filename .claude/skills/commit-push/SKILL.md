---
name: commit-push
description: Use this skill whenever committing changes to the repository or when the user asks for committing the code.
---

Create atomic commits and push to remote.

## Workflow

1. **Analyze Changes**: Review git status and diff
2. **Verify App**:

- run `bun run lint` first and check if there are any issues then run `bun run format`
- then run `bun run build` to check for any ts issues. if there are any issues then fix them
- make sure there are no errors before commiting and pushing.

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
