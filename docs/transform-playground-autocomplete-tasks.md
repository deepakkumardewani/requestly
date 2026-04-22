# Implementation Plan: Transform Playground — JSON-aware autocomplete and UX

## Overview

Add CodeMirror completions for the Transform page’s JSONPath and JavaScript editors, driven by the parsed left-panel JSON. Fix editor stability when input changes (dynamic placeholder currently remounts the right editor). Optionally add small UX wins (copy output, JSON-highlighted output) aligned with existing patterns.

## Architecture decisions

- **Completion data via ref:** Extend [CodeEditor](src/components/request/CodeEditor.tsx) with an optional ref-fed completion source (same pattern as `envVariablesRef`) so parents update suggestions without destroying the editor.
- **Pure path indexer:** New utility module builds capped path lists from parsed `unknown` JSON; invalid JSON uses a small regex fallback consistent with today’s `computePlaceholder` behavior.
- **Runner alignment:** JSONPath suggestions are **suffixes** compatible with [transformRunner](src/lib/transformRunner.ts) implicit `$.` prefix; JS suggestions cover both **fragment** style (`return response.json.` auto-wrap) and explicit `response.*` when users write full statements.

## Task list

### Phase 1: Foundation

- [ ] **Task 1: Path indexing utility**

  **Description:** Implement a pure function (e.g. `buildJsonPathSuggestions(value: unknown, options): string[]`) that walks objects/arrays, emits dotted segments and `[*]` / limited numeric indices, enforces `maxDepth` and `maxPaths`, and deduplicates/prioritizes shallow paths first.

  **Acceptance criteria:**
  - [ ] Given nested objects, returns paths like `user` and `user.email`.
  - [ ] Given arrays, returns `[*]`, `[*].id`, and at most N numeric samples (e.g. `[0]`) when useful.
  - [ ] Stops at configured depth/path count; does not throw on circular refs (track seen objects via `WeakSet` for objects only).
  - [ ] Optional: regex fallback on unparsed text extracts up to K top-level keys (mirrors current placeholder heuristic).

  **Verification:**
  - [ ] `bun run typecheck` passes.
  - [ ] Manual: log or unit-test snapshots for a few fixtures (object, array of objects, empty object).

  **Dependencies:** None

  **Files likely touched:**
  - `src/lib/jsonStructurePaths.ts` (new)
  - `src/lib/jsonStructurePaths.test.ts` (new, if Vitest is added later — otherwise skip test file and rely on manual/typecheck)

  **Estimated scope:** Small (1–2 files)

- [ ] **Task 2: CodeEditor — optional structure completion source**

  **Description:** Add an optional API (e.g. `structureCompletionRef` holding `{ mode: 'jsonpath' | 'js'; paths: string[] }` or separate flags) and register a second `CompletionSource` in the existing `autocompletion({ override: [...] })` alongside env completion. Use `context.matchBefore` to detect the token being typed; filter `paths` by prefix; `apply` inserts only the completion suffix. Skip or reduce noise inside `//` comments (line heuristic).

  **Acceptance criteria:**
  - [ ] With ref populated, typing in the editor opens a completion list filtered by prefix.
  - [ ] Env `{{` completion still works when `envVariables` is set.
  - [ ] No new remounts when only ref contents change (ref updates must not be in editor `useEffect` dependency array that recreates the view).

  **Verification:**
  - [ ] `bun run typecheck` and `bun run lint` pass.
  - [ ] Manual: Transform page — paste JSON, type in right panel, see suggestions.

  **Dependencies:** Task 1 (paths shape stable enough to consume)

  **Files likely touched:**
  - `src/components/request/CodeEditor.tsx`

  **Estimated scope:** Medium (3–5 files if types exported; likely 1 file)

### Checkpoint: Foundation

- [ ] Typecheck and lint clean
- [ ] Path utility behavior sanity-checked on sample payloads
- [ ] CodeEditor still works for all existing call sites without the new prop

### Phase 2: Core feature (vertical slice)

- [ ] **Task 3: Fix dynamic placeholder remount**

  **Description:** [CodeEditor](src/components/request/CodeEditor.tsx) recreates the editor when `placeholder` changes. [TransformPage](src/components/transform/TransformPage.tsx) passes `computePlaceholder(inputBody, mode)`, so pasting JSON resets the right editor. Either: (A) use a **static** placeholder for the transform editors and show dynamic hints in a small non-editor strip under the mode tabs, or (B) move placeholder into a `Compartment` and reconfigure on placeholder change without destroying `EditorView`.

  **Acceptance criteria:**
  - [ ] Pasting or editing left-panel JSON does not reset cursor/focus in the right editor.
  - [ ] Users still see helpful examples (hint row or updated static placeholder).

  **Verification:**
  - [ ] Manual: focus right editor, type partial query, paste JSON on left — focus and text remain.

  **Dependencies:** Task 2 (editor lifecycle understood; can be done in parallel with Task 2 if coordinated)

  **Files likely touched:**
  - `src/components/request/CodeEditor.tsx`
  - `src/components/transform/TransformPage.tsx`

  **Estimated scope:** Small–medium

- [ ] **Task 4: Wire TransformPage**

  **Description:** `useMemo` to build `paths` from `parsedInputJson` (and fallback when parse fails). Sync into `structureCompletionRef` on each render or via `useEffect`. Pass `mode` so JSONPath vs JS triggers differ (fragment vs `response.json` / `response` API). Tune `matchBefore` regexes for each mode.

  **Acceptance criteria:**
  - [ ] JSONPath mode suggests paths consistent with implicit `$.` behavior.
  - [ ] JS mode suggests short paths and key `response` members where appropriate.
  - [ ] Large input does not freeze UI (path cap respected).

  **Verification:**
  - [ ] Manual: switch modes, confirm suggestions change appropriately.
  - [ ] `bun run typecheck`

  **Dependencies:** Tasks 1–3

  **Files likely touched:**
  - `src/components/transform/TransformPage.tsx`

  **Estimated scope:** Small

### Checkpoint: Core feature

- [ ] End-to-end: paste JSON → type query → autocomplete → output updates (debounced)
- [ ] No focus loss when input JSON changes

### Phase 3: Polish (optional)

- [ ] **Task 5: Copy output + JSON highlight**

  **Description:** Add copy buttons for output (and optionally error text), matching patterns in [TransformPlayground](src/components/response/TransformPlayground.tsx). If output parses as JSON, show read-only highlighted JSON instead of plain `<pre>`.

  **Acceptance criteria:**
  - [ ] Copy puts current output on clipboard and shows feedback (toast or brief state).
  - [ ] Valid JSON output is readable (highlight or formatted).

  **Verification:**
  - [ ] Manual: copy, paste elsewhere; visual check of highlighted output.

  **Dependencies:** Task 4

  **Files likely touched:**
  - `src/components/transform/TransformPage.tsx`
  - Possibly shared UI if extracted

  **Estimated scope:** Small

- [ ] **Task 6: Align TransformPlayground (optional)**

  **Description:** Pass the same completion ref pattern using response body parse so inline response playground gets parity.

  **Acceptance criteria:**
  - [ ] Response tab playground offers the same completion behavior when response is JSON.

  **Dependencies:** Task 2, Task 1

  **Files likely touched:**
  - `src/components/response/TransformPlayground.tsx`

  **Estimated scope:** Small

### Checkpoint: Complete

- [ ] All acceptance criteria for in-scope tasks met
- [ ] Ready for review

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| jsonpath-plus dialect mismatch | Medium | Only suggest constructs covered by tests/docs; start conservative (`..`, filters later). |
| Huge documents | High | Strict `maxDepth` / `maxPaths`; index in `useMemo` from parse result only. |
| Completion noise in comments/strings | Low | Heuristic: suppress after `//` on same line; iterate if users report issues. |
| Flaky E2E for autocomplete | Medium | Prefer unit tests on path builder; E2E optional/smoke only. |

## Open questions

- Should the repo add Vitest for `jsonStructurePaths` now, or defer tests until a test runner exists?
- Is parity with `TransformPlayground` required in the same PR or a follow-up?

## Parallelization

- **Parallel after Task 1:** Task 2 (CodeEditor) and Task 3 (placeholder/remount) can proceed in parallel with clear interface agreement on placeholder strategy.
- **Sequential:** Task 4 depends on Tasks 1–3.
