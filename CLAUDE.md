### 1. Plan Node Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately – don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Ask yourself: "Would a staff engineer approve this?"

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer
- Challenge your own work before presenting it

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.

## IMPORTANT Behavioral Rules

1. **Never commit** unless explicitly told to.
2. **Never write test cases** unless explicitly told to.
3. **Never run the server** — it is always running.
4. Always use `bun` to install node modules.
5. Always show summary at the end. See output styles below.

## Component Rules

- Always check if a specific component is available in shadcn before creating a custom component
- Always use shadcn components instead of creating custom components
- Always use shadcn tooltips
- This project uses @base-ui/react v1, not Radix UI. never use asChild as it doesn't exist.
- Always create separate components for the AlertDialog instead of using inline
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

## Summary Output

- Show this output only after a small change.
- Always output a summary of the changes made in the following exact format. No exceptions.
- What was changed
- Why it was changed

## Feature Implementation

- Show this output when there is a large change across multiple files.
- After the implementation is done, show the complete task list that was done.
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
