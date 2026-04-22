# Unit Testing Plan — Requestly

## Overview

Comprehensive unit testing plan for the Requestly codebase. Identified via static analysis across all `src/` directories. Tests are organized in 6 phases ordered by ROI: pure utility functions first (easiest wins, highest confidence), then state management, then hooks, then API routes, then pages, then components.

---

## Coverage Summary

| Area | Files to Test | 100% Target | 80% Target | 60% Target | Skip |
|------|--------------|-------------|------------|------------|------|
| lib | 23 (3 ✅ done) | 15 | 5 | — | 1 |
| stores | 13 | 7 | 6 | — | 0 |
| hooks | 6 | 5 | 1 | — | 1 |
| types | 1 | 1 | — | — | 2 |
| providers | 1 | — | 1 | — | 0 |
| app (API routes) | 2 | 2 | — | — | — |
| app (pages) | 3 | — | 3 | — | 9 |
| components | 46 | — | 46 | 14 | 67 |
| **Total** | **95** | **30** | **62** | **14** | **80** |

---

## Architecture Decisions

- **Test runner**: Use Vitest (already configured in most Next.js/Vite projects; fast, native ESM).
- **React components**: Use React Testing Library — test behavior, not implementation.
- **Zustand stores**: Test store actions directly by calling them and asserting resulting state.
- **Hooks**: Wrap in `renderHook` from React Testing Library.
- **IndexedDB**: Mock via `fake-indexeddb` package.
- **localStorage/sessionStorage**: Use `vi.stubGlobal` or jsdom's built-in.
- **fetch/HTTP**: Mock via `vi.mock` or `msw` for integration-style tests.
- **Test file location**: Co-locate tests at `src/<area>/filename.test.ts(x)`.

---

## Phase 1 — Critical Lib Utilities (Pure Functions)

> These are pure functions with no UI dependencies — highest value, lowest setup cost. Start here.

### 1a — Core Business Logic (100% coverage)

- [ ] `src/lib/variableResolver.ts` — Test variable interpolation: simple vars, nested vars, missing vars, circular references, env scoping
- [ ] `src/lib/chainAssertions.ts` — Test all assertion types: equals, contains, regex, status codes, header checks; pass and fail paths
- [ ] `src/lib/chainControlFlow.ts` — Test condition evaluation, loop logic, break conditions, edge cases
- [ ] `src/lib/curlParser.ts` — Test parsing: headers, body, method, URL, auth flags, multiline cURL, malformed input
- [ ] `src/lib/insomniaParser.ts` — Test Insomnia v4 format parsing, collection structure, env variables, edge cases
- [ ] `src/lib/jsonDiff.ts` — Test diff algorithm: added/removed/changed keys, nested objects, arrays, null values
- [ ] `src/lib/codeGenerators.ts` — Test each language generator: JS fetch, Python requests, curl, etc. for GET/POST/auth requests
- [ ] `src/lib/transformRunner.ts` — Test transform execution: valid transforms, timeout enforcement, error handling, sandboxing
- [ ] `src/lib/shareLink.ts` — Test encode/decode roundtrip, malformed input, large payloads, backward compat
- [ ] `src/lib/utils.ts` — Test each utility function: all branches, null/undefined handling, edge cases
- [ ] `src/lib/errorExplainer.ts` — Test all error categories: network errors, HTTP errors, CORS, DNS, timeout
- [ ] `src/lib/healthMonitor.ts` — Test metric calculations: latency thresholds, status categorization
- [ ] `src/lib/responseSizeEstimator.ts` — Test size estimation for various body types and content
- [ ] `src/lib/timingParser.ts` — Test timing data parsing: valid timings, missing fields, negative values
- [ ] `src/lib/logoUrl.ts` — Test URL generation: known domains, unknown domains, subdomains, IP addresses

### 1b — Already Have Tests ✅

- ✅ `src/lib/jsonStructurePaths.ts` — JSON path extraction (tests exist)
- ✅ `src/lib/structureCompletion.ts` — Autocomplete structure logic (tests exist)
- ✅ `src/lib/codeMirrorPlaceholderCompartment.ts` — CodeMirror extension (tests exist)

### 1c — External Dependency Wrappers (80% coverage)

- [ ] `src/lib/requestRunner.ts` — Test request construction, header merging, timeout, error propagation; mock fetch
- [ ] `src/lib/scriptRunner.ts` — Test pre/post script execution, script errors, output capture, sandbox isolation
- [ ] `src/lib/chainRunner.ts` — Test chain orchestration: sequential execution, branching, assertion failures, early exit
- [ ] `src/lib/idb.ts` — Test CRUD operations, key generation, error handling; mock IndexedDB via fake-indexeddb
- [ ] `src/lib/hub.ts` — Test API calls, response parsing, error states; mock fetch

### Checkpoint 1
- [ ] All lib tests pass with no errors
- [ ] Coverage report confirms 100% on pure functions, 80%+ on wrappers

---

## Phase 2 — Zustand Stores

> High value: all app state flows through these. Test actions and resulting state directly.

### 2a — Complex Stores (100% coverage)

- [ ] `src/stores/useTabsStore.ts` — Test: open tab, close tab, switch active tab, update tab data, tab normalization, IndexedDB hydration, dirty state tracking
- [ ] `src/stores/useCollectionsStore.ts` — Test: create/rename/delete collection, add/move/delete request, bulk import, export, nested collections
- [ ] `src/stores/useEnvironmentsStore.ts` — Test: create/switch/delete environment, set/get variables, `interpolateVariables()` function, localStorage sync
- [ ] `src/stores/useChainStore.ts` — Test: add/remove nodes, add/remove edges, DAG validation, assertion CRUD, execution state, IndexedDB persistence
- [ ] `src/stores/useConnectionStore.ts` — Test: connect/disconnect lifecycle, message handling, reconnect logic; mock WebSocket/SocketIO
- [ ] `src/stores/useTransformStore.ts` — Test: input/output mapping, pipeline state transitions, conditional logic
- [ ] `src/stores/useStandaloneChainStore.ts` — Test: execution start/stop, result tracking, async state transitions, error handling

### 2b — Simple Stores (80% coverage)

- [ ] `src/stores/useHistoryStore.ts` — Test: add entry, clear history, index management, max-size trimming
- [ ] `src/stores/useResponseStore.ts` — Test: store response per tab, retrieve, clear, handle missing tab
- [ ] `src/stores/useSettingsStore.ts` — Test: read/write settings, default values, persistence
- [ ] `src/stores/useJsonCompareStore.ts` — Test: set left/right values, clear state
- [ ] `src/stores/usePlaygroundStore.ts` — Test: set input/output, update mode
- [ ] `src/stores/useUIStore.ts` — Test: toggle modals, open/close command palette, dialog state

### Checkpoint 2
- [ ] All store tests pass
- [ ] State mutations are predictable and reversible in tests

---

## Phase 3 — Custom Hooks

### 3a — Complex Hooks (100% coverage)

- [ ] `src/hooks/useSendRequest.ts` — Test: successful GET/POST, variable resolution before send, pre-script execution, post-script execution, abort controller cancellation, history logging, error handling; mock requestRunner + scriptRunner
- [ ] `src/hooks/useSaveRequest.ts` — Test: save to existing collection, open save modal for unsaved, toast on success, toast on error, state update after save
- [ ] `src/hooks/useKeyboardShortcuts.ts` — Test: each of 15+ keybindings fires correct action, Ctrl vs Cmd platform detection, no-op when input focused
- [ ] `src/hooks/useImportedHubSlugs.ts` — Test: read from localStorage, storage event triggers re-read, cross-tab sync, malformed data handling
- [ ] `src/hooks/useCloseTabGuard.ts` — Test: clean tab closes immediately, dirty tab shows confirm dialog, user confirms closes, user cancels keeps tab

### 3b — Simple Hooks (80% coverage)

- [ ] `src/hooks/useEnvVariableKeys.ts` — Test: returns keys from active env, returns empty array when no env, updates when env switches

### Checkpoint 3
- [ ] All hook tests pass
- [ ] `useSendRequest` mocks are clean and don't leak between tests

---

## Phase 4 — API Routes & Types

### 4a — API Routes (100% coverage)

- [ ] `src/app/api/proxy/route.ts` — Test: valid request proxied correctly, missing URL returns 400, invalid URL returns 400, oversized response returns 413, upstream failure returns 502, response headers forwarded
- [ ] `src/app/api/hub/route.ts` — Test: successful directory listing returns slugs, missing directory returns 404, permission error returns 500

### 4b — Types with Logic (100% coverage)

- [ ] `src/types/chain.ts` — Test `migrateEdge()`: legacy edge shape migrates correctly, modern edge passes through unchanged, partial legacy shape handled

### Checkpoint 4
- [ ] API routes tested with mock filesystem/fetch
- [ ] `migrateEdge()` covers all branches

---

## Phase 5 — App Pages with Business Logic (80% coverage)

- [ ] `src/app/import/page.tsx` — Test: file upload triggers parsing, Postman format detected and imported, Requestly format detected and imported, cURL string parsed, invalid JSON shows error, unsupported format shows error
- [ ] `src/app/settings/page.tsx` — Test: section switching, history clear action, theme change persists, proxy setting update, keyboard shortcut display
- [ ] `src/app/chain/[collectionId]/page.tsx` — Test: add node updates store, delete node removes from graph, edge creation/deletion, run button triggers chain execution, error state display

### Checkpoint 5
- [ ] Page component tests pass with mocked stores and router

---

## Phase 6 — Components (80% coverage)

> Use React Testing Library. Test user interactions and visible output, not implementation details.

### 6a — Chain Components (highest complexity)

- [ ] `src/components/chain/canvas/ChainCanvas.tsx` — Test: renders nodes from store, node selection, edge drag behavior (mock ReactFlow), run triggers store action
- [ ] `src/components/chain/panels/ArrowConfigPanel.tsx` — Test: form fields render, value changes update store, validation errors shown
- [ ] `src/components/chain/panels/ConditionConfigPanel.tsx` — Test: condition type selector, operand inputs, logical operators
- [ ] `src/components/chain/panels/EditRequestPanel.tsx` — Test: request fields editable, changes propagate to store
- [ ] `src/components/chain/panels/NodeDetailsPanel.tsx` — Test: displays node details, assertion list, add/remove assertions
- [ ] `src/components/chain/dialogs/` — Test each dialog: open/close behavior, form submission, cancel

### 6b — Request Components

- [ ] `src/components/request/UrlBar.tsx` — Test: URL input, method selector, send button triggers hook, loading state
- [ ] `src/components/request/CodeEditor.tsx` — Test: renders editor, content changes fire callback, language mode switching
- [ ] `src/components/request/ShareModal.tsx` — Test: generates share URL, copy to clipboard, close behavior
- [ ] `src/components/request/CurlEditor.tsx` — Test: paste cURL parses to request, malformed cURL shows error
- [ ] `src/components/request/AuthEditor.tsx` — Test: auth type selector, field visibility per type, value updates
- [ ] `src/components/request/BodyEditor.tsx` — Test: body type selector, content editing, form-data key/value pairs
- [ ] `src/components/request/tabs/` — Test each tab: renders correct content, tab switching, dirty indicators

### 6c — Collections Components

- [ ] `src/components/collections/CollectionTree.tsx` — Test: tree renders, expand/collapse, right-click context menu, drag-and-drop (mock)
- [ ] `src/components/collections/RequestItem.tsx` — Test: displays name/method, click opens tab, rename inline
- [ ] `src/components/collections/SaveRequestModal.tsx` — Test: collection selector, name input, save/cancel

### 6d — Environment Components (all critical for variable handling)

- [ ] `src/components/environment/` (all 4 files) — Test: environment CRUD, variable editor, active env indicator, variable autocomplete trigger

### 6e — Layout Components

- [ ] `src/components/layout/SidebarMainTab.tsx` — Test: tab navigation, active state, keyboard nav
- [ ] `src/components/layout/TabBar.tsx` — Test: tab renders, close button, active tab highlight, overflow scrolling
- [ ] `src/components/layout/TabContextMenu.tsx` — Test: right-click opens menu, close/close-others/close-all actions
- [ ] `src/components/layout/LeftPanel.tsx` — Test: panel sections render, resize handle
- [ ] `src/components/layout/MainLayout.tsx` — Test: layout structure, panel visibility toggles

### 6f — Feature Components

- [ ] `src/components/import/ImportDialog.tsx` — Test: file drop, tab switching, import button state, success/error feedback
- [ ] `src/components/transform/TransformPage.tsx` — Test: input/output editors, run transform, error display
- [ ] `src/components/json-compare/JsonComparePage.tsx` — Test: left/right inputs, diff rendering, empty state
- [ ] `src/components/response/ErrorExplainer.tsx` — Test: renders correct explanation per error type, suggestion display
- [ ] `src/components/history/` (logic components) — Test: history list renders, entry click opens tab, clear history
- [ ] `src/components/hub/` — Test: hub listing renders, import hub item action
- [ ] `src/components/common/` (shared logic components) — Test each component with logic

### 6g — Providers

- [ ] `src/providers/AppProviders.tsx` — Test: all stores hydrate on mount, CronitorTracker initializes, toast provider renders

### 6h — Low Priority Components (60% coverage — test happy path only)

- [ ] `src/components/chain/nodes/ChainNode.tsx`
- [ ] `src/components/chain/nodes/ConditionNode.tsx`
- [ ] `src/components/common/HealthDot.tsx`
- [ ] (+ 11 other minimal-logic chain node and dialog components)

### Checkpoint 6
- [ ] All component tests pass
- [ ] No test imports implementation internals (only public API)
- [ ] Coverage thresholds met per file

---

## Files to Skip (No Tests Needed)

### src/components/ui/ — All 28 files
Pure shadcn/ui wrappers. Zero business logic. Covered by shadcn upstream tests.

### src/types/index.ts, src/types/hub.ts
Pure TypeScript interface definitions. No executable code. Type correctness enforced by the compiler.

### src/lib/constants.ts
Static configuration object. No logic, no branches.

### src/app/layout.tsx
Root layout with metadata and provider wrapping. No business logic.

### src/app/page.tsx
Single-line wrapper rendering `<MainLayout />`. Test MainLayout instead.

### src/app/settings/constants.ts
Static settings section definitions. No logic.

### src/app/chain/[collectionId]/ChainPageHeader.tsx, ChainPageFooter.tsx, ChainPageEmptyState.tsx
Pure presentation components. Props-driven display only. Better covered by parent component or e2e tests.

### src/app/json-compare/page.tsx, src/app/transform/page.tsx
Layout wrappers. Test the contained components instead.

### src/app/environments/page.tsx
Single redirect call. Covered by e2e.

### src/hooks/useMethodTheme.ts
DOM-only side effect that sets CSS variables. No logic, complex DOM mocking required.

### src/components/ui/* (28 files), Pure presentational components (39 files)
No state, no logic, no interactions. Test visually with Storybook or skip entirely.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| IndexedDB in tests | High | Use `fake-indexeddb` package; reset between tests |
| ReactFlow canvas in ChainCanvas | High | Mock `@xyflow/react` module; test logic not rendering |
| Zustand store leaking state between tests | High | Call `store.setState(initialState)` in `beforeEach` |
| `useSendRequest` has many dependencies | High | Mock `requestRunner`, `scriptRunner`, `variableResolver` at module level |
| localStorage cross-test pollution | Medium | Use `vi.stubGlobal('localStorage', ...)` and reset in `afterEach` |
| Platform-specific keyboard shortcut tests | Medium | Parameterize tests for Mac (metaKey) and Windows (ctrlKey) |
| CodeMirror editor DOM interactions | Medium | Test via value callbacks, not DOM manipulation |

---

## Open Questions

- [ ] Confirm test runner: Vitest vs Jest? (Vitest recommended for Next.js/ESM) - yes vitest
- [ ] Should component tests use JSDOM or happy-dom? (happy-dom is faster) - happy dom
- [ ] Is MSW already configured, or should `vi.mock` be used for fetch? - use vi.mock for now
- [ ] Should coverage thresholds be enforced in CI (vitest --coverage)? - no
- [ ] Any files that need special setup (e.g., ReactFlow, CodeMirror) that require global mocks in vitest.setup.ts? - not sure you decide
