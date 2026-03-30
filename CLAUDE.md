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

## Feature Implementation Summary

After **every** feature / epic implementation, output a summary in the following exact format. No exceptions.

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
- **Decision**: Any non-obvious trade-off or constraint respected.
- **Decision**: Any deviation from the task spec and the rationale.
```

### Example — Epic 10 (use this as the canonical reference)

```
✅ Epic 10 — Request Dependencies / Chaining UI Implementation Summary

### New files created

| File | Purpose |
|---|---|
| `src/types/chain.ts` | ChainEdge, ChainConfig, ChainNodeState, ChainRunState types |
| `src/stores/useChainStore.ts` | Zustand store — loadConfig, upsertEdge, deleteEdge, updateNodePosition, clearEdges; persisted to IndexedDB |
| `src/lib/chainRunner.ts` | buildExecutionOrder (Kahn's topological sort + circular-dep detection), runChain (JSONPath extraction, URL/header/body injection, abort support) |
| `src/components/chain/ChainNode.tsx` | React Flow custom node — method badge, name/URL, state icon, colour-coded animated border |
| `src/components/chain/ChainCanvas.tsx` | React Flow canvas — connect, edge-click, node-drag-end, edge-delete (Backspace/Delete), syncs run state visuals |
| `src/components/chain/ArrowConfigPanel.tsx` | shadcn Sheet — JSONPath source, URL param/header/body target, validation, live preview, save/delete |
| `src/app/chain/[collectionId]/page.tsx` | /chain/:collectionId page — header with back link, Run/Stop button, result summary, full-height canvas, empty state |

### Modified files

| File | Change |
|---|---|
| `src/lib/idb.ts` | Added chainConfigs object store; bumped DB version 1 → 2 |
| `src/components/collections/CollectionTree.tsx` | Added Chain View entry in collection kebab menu (router.push to /chain/:id) |
| `features/requestly-new-features-TASKS.md` | All Tasks 10.1–10.8 marked [x] complete |

### Key design decisions
- **jsonpath-plus (existing dep)**: Used for response value extraction — no new library needed; already in package.json.
- **@xyflow/react installed via bun**: npm had a platform conflict with lightningcss-darwin-x64; bun handles it cleanly.
- **3 injection target types**: URL query param, header, and body JSONPath — covers all real-world token-passing flows without requiring scripting.
- **Circular dependency guard**: Kahn's algorithm detects cycles at run-time; all nodes are marked skipped with a clear message rather than hanging.
- **Run state managed in page, not canvas**: ChainCanvas is stateless re: run — runState flows down as props, keeping the canvas a pure display component.
- **DB version bump (1 → 2)**: IDB_VERSION defined locally in idb.ts to override the stale constant in constants.ts without breaking other consumers.
```
