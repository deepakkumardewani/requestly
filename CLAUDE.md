## Important CLI Tools (use these, not the defaults)

- `bun` instead of `npm`
- `bun install` instead of `npm install`
- `bun run` instead of `npm run`
- `gh` is installed - use for all Git operations
- **IMPORTANT**: NEVER run `npm` commands (e.g., `npm install`, `npm run`) at the root directory. This will break the project. All package operations must be run using `bun`.

## Conditional Reference Table

| Task                                      | Reference                                           |
| ----------------------------------------- | --------------------------------------------------- |
| Naming conventions, code style            | `.claude/skills/code-style/SKILL.md`                |
| TypeScript best practices, error handling | `.claude/skills/typescript-best-practices/SKILL.md` |
| Shadcn usage                              | `.claude/skills/shadcn/SKILL.md`                    |
| Component Rules                           | `.claude/skills/component-rules/SKILL.md`           |

---

## Client state: Zustand store vs React Context

Use the pattern that matches **scope** and **persistence**. This project standardizes cross-cutting UI on **Zustand** (`src/stores/`).

### Prefer a Zustand store when

- State is shared by **sibling or distant** components (e.g. sidebar header + nested tree).
- State is **persisted** (`localStorage`, IndexedDB) or may be read outside React later.
- Multiple features might read/update the same state (command palette, shortcuts, panels).
- You want to avoid provider placement and test wrappers.
- The state is **app/sidebar UI preference**, not domain data — still use a store (see `useUIStore`, `useFolderExpandStore`).

Place new stores in `src/stores/use<Name>Store.ts`. Follow existing conventions: serializable state, persist in actions, no functions in persisted payloads.

### Prefer React Context when

- State is **scoped to one subtree** and only descendants consume it.
- State is **ephemeral** (wizard step, modal draft, open/closed for a single compound component).
- You are avoiding prop drilling **one level deep** inside a self-contained feature.
- The provider and all consumers live in the **same module/feature folder**.

### Quick decision

| Question                              | Store                      | Context     |
| ------------------------------------- | -------------------------- | ----------- |
| Needed outside the provider subtree?  | Yes                        | No          |
| Persisted across sessions?            | Yes                        | Rarely      |
| Used in tests without extra wrappers? | Prefer store               | OK if local |
| Domain/collection/request data?       | `useCollectionsStore` etc. | No          |

When unsure, check `src/stores/` for a similar case before adding Context.

---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
