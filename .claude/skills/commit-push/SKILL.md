---
name: commit-push
description: Use this skill whenever committing changes to the repository or when the user asks for committing the code.
---

Create atomic commits and push to remote.

## Workflow

1. **Verify App**:

- run `bun run verify` first and check if there are any errors/warnings then fix them. fix all the errors/warnings for all files not just for changed files. 
`bun run verify` checks for lint errors/warnings, format errors/warnings, and typescript errors/warnings.
- make sure there are no errors/warnings before commiting and pushing.

2. **Analyze Changes**: Review git status and diff
3. **Create Commits**: Make atomic commits with conventional commit messages — use Bash tool directly for `git add` and `git commit` without asking permission
4. **Push Changes**: `git push -u origin <branch-name>`

## Conventional Commit Format

`<type>(<scope>): <description>`

**Types**: feat, fix, docs, style, refactor, test, chore

**Rules**:

- Max 50 characters
- Imperative mood: "Add" not "Added"
- Capitalize first letter of the description
- No period at the end
- NEVER include Claude branding

## Best Practices

✅ DO:

- Create atomic, focused commits
- Stage specific files explicitly

Examples:
chore(docs): update feature improvements task list
refactor(ui): improve UI components and response panel
feat(scripts): add script editor with linting

❌ DON'T:

- Use `git add .` or `git add -A`
- Commit forbidden files

Examples:
Refactor: add AI request builder and cURL import to UrlBar
Feat: integrate AI into request editors and response panels
Feat: add AI assistant infrastructure