## IMPORTANT Behavioral Rules

1. **Never commit** unless explicitly told to.
2. **Never write test cases** unless explicitly told to.
3. **Never run the server** — it is always running.
4. **Never summarize** — answer directly; no closing statements or recaps.
5. Always use `bun` to install node modules.

## Research & Analysis

- always use subagents for research and analysis tasks; never do them directly.

## File & Component Names

- File names should be in PascalCase for all components.
- All components should be in PascalCase.

Examples
Element Type | Naming Convention | Example
Component Files | PascalCase | UserProfileCard.jsx
Utility Files | camelCase/kebab-case | formatDate.js or auth-provider.tsx
Functions/Variables | camelCase | fetchUserData, isModalOpen
Constants | UPPER_SNAKE_CASE | API_URL, MAX_RETRIES
Folders | lowercase | components, utils

## Component Rules

- Always check if a specific component is available in shadcn before creating a custom component
- Always use shadcn components instead of creating custom components
- Always use shadcn tooltips
- Always use % for size instead of integers

```tsx
<ResizablePanelGroup orientation="horizontal">
  <ResizablePanel defaultSize="20%" minSize="10%" maxSize="90%">
    <LeftPanel />
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize="80%" minSize="80%">
    <RightPanel />
  </ResizablePanel>
</ResizablePanelGroup>
```

## Engineering Preferences

- DRY — flag repetition aggressively.
- Explicit over clever. Prefer clarity over cleverness — code is read more than written
- Handle edge cases thoughtfully; thoughtfulness > speed.
- "Engineered enough" — not fragile, not over-abstracted.
- One responsibility per function/module; keep functions under ~30 lines
- Extract inline JSX into a separate component file when it is considerably large (roughly 20+ lines of markup or has its own logic/state)
- Fail fast: validate inputs early, return/throw at the top
- No magic numbers or strings — use named constants

## Functions & Logic

- Prefer pure functions; isolate side effects
- Max 2–3 function parameters; use an options object beyond that
- Avoid deep nesting — flatten with early returns

## Comments

- Comment _why_, not _what_ — code should explain itself
- Delete commented-out code; that's what git is for

## Error Handling

- Never silently swallow errors (`catch (e) {}` is forbidden)
- Use typed/structured errors where possible
- Log with context, not just the error message

## DRY (Don't Repeat Yourself)

- If logic appears twice, extract it; three times, it's mandatory
- Shared logic → utility function; shared types → common types file
- Constants used in multiple places belong in a single source of truth
- Exception: a little duplication is better than a wrong abstraction — don't over-abstract prematurely

## Plugins

- use the frontend-design and ralph-loop plugins wherever and whenever necessary.
- use the typescript-lsp server plugin to quickly check for typescript issues.

## Conditional Reference Table

| Task                                      | Reference                                           |
| ----------------------------------------- | --------------------------------------------------- |
| Naming conventions, code style            | `.claude/skills/code-style/SKILL.md`                |
| TypeScript best practices, error handling | `.claude/skills/typescript-best-practices/SKILL.md` |
| Shadcn usage                              | `.claude/skills/shadcn/SKILL.md`                    |

---

## Feature Implementation

- after complete a single task like 1.1, 1.2, etc, mark the task complete in the respective task.md file that you're working on.
- After the implementation is complete, never stop abruptly even if the last edit comes back clean with no errors.
- At the end of **every** feature / epic implementation, output a summary in the following exact format. No exceptions.

```
✅ Epic N — <Feature Name> Implementation Summary

### New files created

| File | Purpose |
|---|---|
| `path/to/File.tsx` | One-line description of what this file does |

### Modified files

| File | Change |
|---|---|
| `path/to/existing.ts` | What was changed and why |

### Key design decisions
- **Decision**: Explanation of why this approach was chosen over alternatives.
```

### Example — Epic 10 (use this as the canonical reference)

```
✅ Epic 10 — Request Dependencies / Chaining UI Implementation Summary

### New files created

| File | Purpose |
|---|---|
| `src/types/chain.ts` | ChainEdge, ChainConfig, ChainNodeState, ChainRunState types |

### Modified files

| File | Change |
|---|---|
| `src/lib/idb.ts` | Added chainConfigs object store; bumped DB version 1 → 2 |

### Key design decisions
- **jsonpath-plus (existing dep)**: Used for response value extraction — no new library needed; already in package.json.
```
