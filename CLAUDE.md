## IMPORTANT Behavioral Rules

1. **Never commit** unless explicitly told to.
2. **Never write test cases** unless explicitly told to.
3. **Never run the server** — it is always running.
4. **Never summarize** — answer directly; no closing statements or recaps.

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

## Engineering Preferences

- DRY — flag repetition aggressively.
- Explicit over clever. Prefer clarity over cleverness — code is read more than written
- Handle edge cases thoughtfully; thoughtfulness > speed.
- "Engineered enough" — not fragile, not over-abstracted.
- One responsibility per function/module; keep functions under ~30 lines
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

## Review Preferences & Methodology

Review plans thoroughly before making code changes. For every issue or recommendation, explain concrete tradeoffs, give an opinionated recommendation, and ask for input before assuming a direction.

## Date / Time Formats

- Date: `mm/dd/yyyy` | Time: `HH:MM` (24-hour)

**BEFORE STARTING A REVIEW**, ask which mode:

1. **BIG CHANGE**: Interactive, one section at a time (Architecture → Code Quality → Performance), max 4 top issues per section.
2. **SMALL CHANGE**: Interactive, ONE question per review section.

**FOR EACH STAGE**: output explanation + pros/cons + opinionated recommendation, then use `AskUserQuestion`. Number issues, letter options. Recommended option is always first.

Review sections:

1. **Architecture** — system design, component boundaries, dependency graph, data flow, security.
2. **Code Quality** — organization, DRY violations, error handling, technical debt, over/under-engineering.
3. **Performance** — memory usage, caching opportunities, slow code paths.

After each section, pause and ask for feedback before moving on.

## Conditional Reference Table

| Task                                      | Reference                                           |
| ----------------------------------------- | --------------------------------------------------- |
| Naming conventions, code style            | `.claude/skills/code-style/SKILL.md`                |
| TypeScript best practices, error handling | `.claude/skills/typescript-best-practices/SKILL.md` |
| Shadcn usage                              | `.claude/skills/shadcn/SKILL.md`                    |
