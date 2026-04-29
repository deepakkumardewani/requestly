# Unit Testing Plan — Requestly

## Overview

Comprehensive unit testing plan for the Requestly codebase. Identified via static analysis across all `src/` directories. Tests are organized in 6 phases ordered by ROI: pure utility functions first (easiest wins, highest confidence), then state management, then hooks, then API routes, then pages, then components.

---

## Coverage summary (Vitest v8)

Run `bun run test:coverage`. Reports are written under `coverage/`; `vitest.config.ts` enables the `json-summary` reporter (`coverage/coverage-summary.json`).

| Metric | Snapshot (2026-04-29) |
|--------|------------------------|
| **Lines** | **71.88%** (4226/5879) |
| **Statements** | **69.71%** (4542/6515) |
| **Branches** | **57.41%** (2500/4354) |
| **Functions** | **64.63%** (1221/1889) |

Phase sections below use **100% / 80% / 60%** as *priorities* (where to invest next). They are **not** guarantees that every file already meets that line coverage.

**Regenerate the per-file table** after changing tests:

`bun run test:coverage && node scripts/print-todo-coverage-table.cjs`

(or `bun run coverage:table` after a coverage run — requires `coverage/coverage-summary.json`)

### Planning targets (file counts by priority)

| Area | Files to test | High priority (aim ~100% lines) | Medium (~80%) | Lower (~60%) | Skip |
|------|---------------|----------------------------------|---------------|--------------|------|
| lib | 23 | 15 | 5 | — | 1 |
| stores | 13 | 7 | 6 | — | 0 |
| hooks | 6 | 5 | 1 | — | 1 |
| types | 1 | 1 | — | — | 2 |
| providers | 1 | — | 1 | — | 0 |
| app (API routes) | 2 | 2 | — | — | — |
| app (pages) | 3 | — | 3 | — | 9 |
| components | 46 | — | 46 | 14 | 67 |
| **Total** | **95** | **30** | **62** | **14** | **80** |

### Measured line coverage — tracked sources

Snapshot: **2026-04-29**. Sources = paths referenced in this doc plus any file that sits next to a co-located `*.spec.ts` / `*.spec.tsx` under `src/lib`, `src/components`, `src/app`, `src/hooks`, `src/stores`, `src/types`, `src/providers`. Line % = Vitest v8 **lines**.

| Source file | Lines % | Fraction |
|-------------|---------|----------|
| `src/app/api/hub/route.ts` | 100.00 | 8/8 |
| `src/app/api/proxy/route.ts` | 100.00 | 27/27 |
| `src/app/chain/[collectionId]/page.tsx` | 46.03 | 116/252 |
| `src/app/import/page.tsx` | 88.23 | 60/68 |
| `src/app/settings/page.tsx` | 100.00 | 11/11 |
| `src/components/chain/ChainList.tsx` | 29.54 | 13/44 |
| `src/components/chain/canvas/AutoLayoutControl.tsx` | 90.90 | 10/11 |
| `src/components/chain/canvas/BlockMenu.tsx` | 89.47 | 17/19 |
| `src/components/chain/canvas/ChainCanvas.tsx` | 46.96 | 85/181 |
| `src/components/chain/canvas/DeletableEdge.tsx` | 85.71 | 6/7 |
| `src/components/chain/canvas/GhostNode.tsx` | 100.00 | 2/2 |
| `src/components/chain/canvas/GhostPlacementHandler.tsx` | 72.72 | 16/22 |
| `src/components/chain/canvas/NodeContextMenu.tsx` | 50.00 | 9/18 |
| `src/components/chain/dialogs/ApiPickerDialog.tsx` | 95.23 | 20/21 |
| `src/components/chain/dialogs/JsonPathExplorer.tsx` | 97.05 | 33/34 |
| `src/components/chain/dialogs/PromoteToEnvPopover.tsx` | 86.36 | 19/22 |
| `src/components/chain/dialogs/ValuePickerPopover.tsx` | 77.27 | 17/22 |
| `src/components/chain/nodes/ChainNode.tsx` | 52.63 | 10/19 |
| `src/components/chain/nodes/ConditionNode.tsx` | 52.38 | 11/21 |
| `src/components/chain/nodes/DelayNode.tsx` | 37.14 | 13/35 |
| `src/components/chain/nodes/DisplayNode.tsx` | 57.44 | 27/47 |
| `src/components/chain/nodes/NodeToolbar.tsx` | 40.00 | 4/10 |
| `src/components/chain/panels/ArrowConfigPanel.tsx` | 47.74 | 74/155 |
| `src/components/chain/panels/ConditionConfigPanel.tsx` | 68.96 | 20/29 |
| `src/components/chain/panels/EditRequestPanel.tsx` | 47.82 | 22/46 |
| `src/components/chain/panels/NodeDetailsPanel.tsx` | 62.50 | 40/64 |
| `src/components/chain/panels/arrow-config/FormattedJsonResponseBody.tsx` | 83.33 | 5/6 |
| `src/components/collections/CollectionTree.tsx` | 68.33 | 41/60 |
| `src/components/collections/HealthDot.tsx` | 85.71 | 24/28 |
| `src/components/collections/RequestItem.tsx` | 83.33 | 35/42 |
| `src/components/collections/SaveRequestModal.tsx` | 95.83 | 23/24 |
| `src/components/common/CommandPalette.tsx` | 67.85 | 19/28 |
| `src/components/common/ConfirmDeleteDialog.tsx` | 100.00 | 2/2 |
| `src/components/common/EnvAutocompleteInput.tsx` | 87.03 | 47/54 |
| `src/components/common/ErrorBoundary.tsx` | 100.00 | 8/8 |
| `src/components/common/KVTable.tsx` | 80.95 | 17/21 |
| `src/components/common/SparklineChart.tsx` | 100.00 | 10/10 |
| `src/components/environment/EnvListPanel.tsx` | 85.10 | 40/47 |
| `src/components/environment/EnvManagerDialog.tsx` | 87.50 | 21/24 |
| `src/components/environment/EnvSelector.tsx` | 50.00 | 12/24 |
| `src/components/environment/EnvVariableTable.tsx` | 83.87 | 26/31 |
| `src/components/history/HistoryItem.tsx` | 100.00 | 12/12 |
| `src/components/history/HistoryList.tsx` | 100.00 | 10/10 |
| `src/components/hub/HubProviderCard.tsx` | 100.00 | 19/19 |
| `src/components/hub/HubTab.tsx` | 100.00 | 26/26 |
| `src/components/import/ImportDialog.tsx` | 45.45 | 50/110 |
| `src/components/json-compare/JsonComparePage.tsx` | 85.10 | 40/47 |
| `src/components/layout/LeftPanel.tsx` | 53.84 | 7/13 |
| `src/components/layout/MainLayout.tsx` | 40.00 | 22/55 |
| `src/components/layout/SidebarMainTab.tsx` | 66.10 | 39/59 |
| `src/components/layout/TabBar.tsx` | 78.04 | 32/41 |
| `src/components/layout/TabContextMenu.tsx` | 67.64 | 23/34 |
| `src/components/request/AuthEditor.tsx` | 82.75 | 24/29 |
| `src/components/request/BodyEditor.tsx` | 94.11 | 16/17 |
| `src/components/request/CodeEditor.tsx` | 68.90 | 82/119 |
| `src/components/request/CurlEditor.tsx` | 83.33 | 20/24 |
| `src/components/request/RequestTabs.tsx` | 88.88 | 8/9 |
| `src/components/request/ShareModal.tsx` | 70.66 | 53/75 |
| `src/components/request/UrlBar.tsx` | 43.39 | 23/53 |
| `src/components/request/tabs/GraphQLTabs.tsx` | 100.00 | 11/11 |
| `src/components/request/tabs/HttpTabs.tsx` | 84.61 | 11/13 |
| `src/components/request/tabs/WebSocketTabs.tsx` | 69.23 | 9/13 |
| `src/components/response/ErrorExplainer.tsx` | 93.93 | 31/33 |
| `src/components/transform/TransformPage.tsx` | 85.71 | 66/77 |
| `src/hooks/useCloseTabGuard.ts` | 100.00 | 15/15 |
| `src/hooks/useEnvVariableKeys.ts` | 100.00 | 5/5 |
| `src/hooks/useImportedHubSlugs.ts` | 91.66 | 11/12 |
| `src/hooks/useKeyboardShortcuts.ts` | 100.00 | 72/72 |
| `src/hooks/useSaveRequest.ts` | 100.00 | 17/17 |
| `src/hooks/useSendRequest.ts` | 97.10 | 67/69 |
| `src/lib/anonUser.ts` | 84.61 | 11/13 |
| `src/lib/chainAssertions.ts` | 94.44 | 51/54 |
| `src/lib/chainControlFlow.ts` | 97.77 | 44/45 |
| `src/lib/chainRunner.ts` | 81.65 | 178/218 |
| `src/lib/codeGenerators.ts` | 87.95 | 241/274 |
| `src/lib/crypto.ts` | 97.14 | 34/35 |
| `src/lib/curlParser.ts` | 95.37 | 103/108 |
| `src/lib/errorExplainer.ts` | 100.00 | 10/10 |
| `src/lib/healthMonitor.ts` | 95.23 | 20/21 |
| `src/lib/hub-logo.ts` | 100.00 | 19/19 |
| `src/lib/hub.ts` | 100.00 | 23/23 |
| `src/lib/idb.ts` | 100.00 | 24/24 |
| `src/lib/insomniaParser.ts` | 85.71 | 48/56 |
| `src/lib/jsonDiff.ts` | 93.65 | 59/63 |
| `src/lib/jsonStructurePaths.ts` | 100.00 | 64/64 |
| `src/lib/redis.ts` | 100.00 | 1/1 |
| `src/lib/requestRunner.ts` | 82.89 | 63/76 |
| `src/lib/responseMetrics.ts` | 100.00 | 33/33 |
| `src/lib/scriptRunner.ts` | 83.92 | 47/56 |
| `src/lib/shareLink.ts` | 89.74 | 70/78 |
| `src/lib/shareRateLimitLocal.ts` | 85.71 | 36/42 |
| `src/lib/shareServer.ts` | 100.00 | 40/40 |
| `src/lib/structureCompletion.ts` | 100.00 | 24/24 |
| `src/lib/timingParser.ts` | 100.00 | 6/6 |
| `src/lib/transformRunner.ts` | 86.84 | 33/38 |
| `src/lib/utils.ts` | 100.00 | 56/56 |
| `src/lib/variableResolver.ts` | 100.00 | 14/14 |
| `src/providers/AppProviders.tsx` | 100.00 | 11/11 |
| `src/stores/useChainStore.ts` | 100.00 | 157/157 |
| `src/stores/useCollectionsStore.ts` | 83.33 | 60/72 |
| `src/stores/useConnectionStore.ts` | 98.66 | 74/75 |
| `src/stores/useEnvironmentsStore.ts` | 93.54 | 58/62 |
| `src/stores/useHistoryStore.ts` | 93.61 | 44/47 |
| `src/stores/useJsonCompareStore.ts` | 100.00 | 12/12 |
| `src/stores/usePlaygroundStore.ts` | 100.00 | 9/9 |
| `src/stores/useResponseStore.ts` | 100.00 | 8/8 |
| `src/stores/useSettingsStore.ts` | 95.65 | 22/23 |
| `src/stores/useStandaloneChainStore.ts` | 94.73 | 162/171 |
| `src/stores/useTabsStore.ts` | 95.89 | 70/73 |
| `src/stores/useTransformStore.ts` | 100.00 | 10/10 |
| `src/stores/useUIStore.ts` | 100.00 | 15/15 |
| `src/types/chain.ts` | 100.00 | 4/4 |

**Workspace total (Vitest):** 71.88% lines (4226/5879)

---

## Architecture Decisions

- **Test runner**: Use Vitest (already configured in most Next.js/Vite projects; fast, native ESM).
- **React components**: Use React Testing Library — test behavior, not implementation.
- **Zustand stores**: Test store actions directly by calling them and asserting resulting state.
- **Hooks**: Wrap in `renderHook` from React Testing Library.
- **IndexedDB**: Mock via `fake-indexeddb` package.
- **localStorage/sessionStorage**: Use `vi.stubGlobal` or jsdom's built-in.
- **fetch/HTTP**: Mock via `vi.mock` or `msw` for integration-style tests.
- **Test file location**: Co-locate specs as `src/<area>/<name>.spec.ts` or `.spec.tsx`.

---

## Phase 1 — Critical Lib Utilities (Pure Functions)

> These are pure functions with no UI dependencies — highest value, lowest setup cost. Start here.

### 1a — Core business logic (prioritize toward ~100% lines)

- [x] `src/lib/variableResolver.ts` — Test variable interpolation: simple vars, nested vars, missing vars, circular references, env scoping
- [x] `src/lib/chainAssertions.ts` — Test all assertion types: equals, contains, regex, status codes, header checks; pass and fail paths
- [x] `src/lib/chainControlFlow.ts` — Test condition evaluation, loop logic, break conditions, edge cases
- [x] `src/lib/curlParser.ts` — Test parsing: headers, body, method, URL, auth flags, multiline cURL, malformed input
- [x] `src/lib/insomniaParser.ts` — Test Insomnia v4 format parsing, collection structure, env variables, edge cases
- [x] `src/lib/jsonDiff.ts` — Test diff algorithm: added/removed/changed keys, nested objects, arrays, null values
- [x] `src/lib/codeGenerators.ts` — Test each language generator: JS fetch, Python requests, curl, etc. for GET/POST/auth requests
- [x] `src/lib/transformRunner.ts` — Test transform execution: valid transforms, timeout enforcement, error handling, sandboxing
- [x] `src/lib/shareLink.ts` — Test encode/decode roundtrip, malformed input, large payloads, backward compat
- [x] `src/lib/utils.ts` — Test each utility function: all branches, null/undefined handling, edge cases
- [x] `src/lib/errorExplainer.ts` — Test all error categories: network errors, HTTP errors, CORS, DNS, timeout
- [x] `src/lib/healthMonitor.ts` — Test metric calculations: latency thresholds, status categorization
- [x] `src/lib/responseMetrics.ts` — Test wire-size helpers: header blocks, KV headers, body encodings, auth lines on `HttpTab`
- [x] `src/lib/timingParser.ts` — Test timing data parsing: valid timings, missing fields, negative values
- [x] `src/lib/hub-logo.ts` — Test URL generation: known domains, unknown domains, subdomains, IP addresses

### 1b — Already have tests ✅

- ✅ `src/lib/jsonStructurePaths.ts` — JSON path extraction (tests exist)
- ✅ `src/lib/structureCompletion.ts` — Autocomplete structure logic (tests exist)
- ✅ `src/lib/codeMirrorPlaceholderCompartment.spec.ts` — CodeMirror placeholder `Compartment` pattern (spec documents behavior; there is no separate `codeMirrorPlaceholderCompartment.ts` module)

### 1c — External dependency wrappers (prioritize toward ~80% lines)

- [x] `src/lib/requestRunner.ts` — Test request construction, header merging, timeout, error propagation; mock fetch
- [x] `src/lib/scriptRunner.ts` — Test pre/post script execution, script errors, output capture, sandbox isolation
- [x] `src/lib/chainRunner.ts` — Test chain orchestration: sequential execution, branching, assertion failures, early exit
- [x] `src/lib/idb.ts` — Test `getDB()` when `window` is absent; `openDB` wiring; upgrade handler creates stores and indexes (mock `idb`)
- [x] `src/lib/hub.ts` — Test API calls, response parsing, error states; mock fetch

### Checkpoint 1
- [x] All lib tests pass with no errors
- [x] Wrapper libs (`requestRunner`, `scriptRunner`, `chainRunner`, `idb`) register **≥80%** lines in the [measured table](#measured-line-coverage--tracked-sources) after `bun run test:coverage`

---

## Phase 2 — Zustand Stores

> High value: all app state flows through these. Test actions and resulting state directly.

### 2a — Complex Stores (100% coverage)

- [x] `src/stores/useTabsStore.ts` — Test: open tab, close tab, switch active tab, update tab data, tab normalization, IndexedDB hydration, dirty state tracking
- [x] `src/stores/useCollectionsStore.ts` — Test: create/rename/delete collection, add/move/delete request, bulk import, export, nested collections
- [x] `src/stores/useEnvironmentsStore.ts` — Test: create/switch/delete environment, set/get variables, `interpolateVariables()` function, localStorage sync
- [x] `src/stores/useChainStore.ts` — Test: add/remove nodes, add/remove edges, DAG validation, assertion CRUD, execution state, IndexedDB persistence
- [x] `src/stores/useConnectionStore.ts` — Test: connect/disconnect lifecycle, message handling, reconnect logic; mock WebSocket/SocketIO
- [x] `src/stores/useTransformStore.ts` — Test: input/output mapping, pipeline state transitions, conditional logic
- [x] `src/stores/useStandaloneChainStore.ts` — Test: execution start/stop, result tracking, async state transitions, error handling

### 2b — Simple Stores (80% coverage)

- [x] `src/stores/useHistoryStore.ts` — Test: add entry, clear history, index management, max-size trimming
- [x] `src/stores/useResponseStore.ts` — Test: store response per tab, retrieve, clear, handle missing tab
- [x] `src/stores/useSettingsStore.ts` — Test: read/write settings, default values, persistence
- [x] `src/stores/useJsonCompareStore.ts` — Test: set left/right values, clear state
- [x] `src/stores/usePlaygroundStore.ts` — Test: set input/output, update mode
- [x] `src/stores/useUIStore.ts` — Test: toggle modals, open/close command palette, dialog state

### Checkpoint 2
- [ ] All store tests pass
- [ ] State mutations are predictable and reversible in tests

---

## Phase 3 — Custom Hooks

### 3a — Complex Hooks (100% coverage)

- [x] `src/hooks/useSendRequest.ts` — Test: successful GET/POST, variable resolution before send, pre-script execution, post-script execution, abort controller cancellation, history logging, error handling; mock requestRunner + scriptRunner
- [x] `src/hooks/useSaveRequest.ts` — Test: save to existing collection, open save modal for unsaved, toast on success, toast on error, state update after save
- [x] `src/hooks/useKeyboardShortcuts.ts` — Test: each of 15+ keybindings fires correct action, Ctrl vs Cmd platform detection, no-op when input focused
- [x] `src/hooks/useImportedHubSlugs.ts` — Test: read from localStorage, storage event triggers re-read, cross-tab sync, malformed data handling
- [x] `src/hooks/useCloseTabGuard.ts` — Test: clean tab closes immediately, dirty tab shows confirm dialog, user confirms closes, user cancels keeps tab

### 3b — Simple Hooks (80% coverage)

- [x] `src/hooks/useEnvVariableKeys.ts` — Test: returns keys from active env, returns empty array when no env, updates when env switches

### Checkpoint 3
- [ ] All hook tests pass
- [ ] `useSendRequest` mocks are clean and don't leak between tests

---

## Phase 4 — API Routes & Types

### 4a — API Routes (100% coverage)

- [x] `src/app/api/proxy/route.ts` — Test: valid request proxied correctly, missing URL returns 400, invalid URL returns 400, oversized response returns 413, upstream failure returns 502, response headers forwarded
- [x] `src/app/api/hub/route.ts` — Test: successful directory listing returns slugs; files filtered out; readdir failure returns empty slugs (matches route behavior)

### 4b — Types with Logic (100% coverage)

- [x] `src/types/chain.ts` — Test `migrateEdge()`: legacy edge shape migrates correctly, modern edge passes through unchanged, partial legacy shape handled

### Checkpoint 4
- [x] API routes tested with mock filesystem/fetch
- [x] `migrateEdge()` covers all branches

---

## Phase 5 — App Pages with Business Logic (80% coverage)

- [x] `src/app/import/page.tsx` — Test: file upload triggers parsing, Postman format detected and imported, Requestly format detected and imported, cURL string parsed, invalid JSON shows error, unsupported format shows error
- [x] `src/app/settings/page.tsx` — Test: section switching, history clear action, theme change persists, proxy setting update, keyboard shortcut display
- [x] `src/app/chain/[collectionId]/page.tsx` — Test: add node updates store, delete node removes from graph, edge creation/deletion, run button triggers chain execution, error state display

### Checkpoint 5
- [x] Page component tests pass with mocked stores and router

---

## Phase 6 — Components (80% coverage)

> Use React Testing Library. Test user interactions and visible output, not implementation details.

### 6a — Chain Components (highest complexity)

- [x] `src/components/chain/canvas/ChainCanvas.tsx` — Test: renders nodes from store, node selection, edge drag behavior (mock ReactFlow), run triggers store action
- [x] `src/components/chain/panels/ArrowConfigPanel.tsx` — Test: form fields render, value changes update store, validation errors shown
- [x] `src/components/chain/panels/ConditionConfigPanel.tsx` — Test: condition type selector, operand inputs, logical operators
- [x] `src/components/chain/panels/EditRequestPanel.tsx` — Test: request fields editable, changes propagate to store
- [x] `src/components/chain/panels/NodeDetailsPanel.tsx` — Test: displays node details, assertion list, add/remove assertions
- [x] `src/components/chain/dialogs/` — Test each dialog: open/close behavior, form submission, cancel

### 6b — Request Components

- [x] `src/components/request/UrlBar.tsx` — Test: URL input, method selector, send button triggers hook, loading state
- [x] `src/components/request/CodeEditor.tsx` — Test: renders editor, content changes fire callback, language mode switching
- [x] `src/components/request/ShareModal.tsx` — Test: generates share URL, copy to clipboard, close behavior
- [x] `src/components/request/CurlEditor.tsx` — Test: paste cURL parses to request, malformed cURL shows error
- [x] `src/components/request/AuthEditor.tsx` — Test: auth type selector, field visibility per type, value updates
- [x] `src/components/request/BodyEditor.tsx` — Test: body type selector, content editing, form-data key/value pairs
- [x] `src/components/request/tabs/` — Test each tab: renders correct content, tab switching, dirty indicators

### 6c — Collections Components

- [x] `src/components/collections/CollectionTree.tsx` — Test: tree renders, expand/collapse, right-click context menu, drag-and-drop (mock)
- [x] `src/components/collections/RequestItem.tsx` — Test: displays name/method, click opens tab, rename inline
- [x] `src/components/collections/SaveRequestModal.tsx` — Test: collection selector, name input, save/cancel

### 6d — Environment Components (all critical for variable handling)

- [x] `src/components/environment/` (all 4 files) — Test: environment CRUD, variable editor, active env indicator, variable autocomplete trigger

### 6e — Layout Components

- [x] `src/components/layout/SidebarMainTab.tsx` — Test: tab navigation, active state, keyboard nav
- [x] `src/components/layout/TabBar.tsx` — Test: tab renders, close button, active tab highlight, overflow scrolling
- [x] `src/components/layout/TabContextMenu.tsx` — Test: right-click opens menu, close/close-others/close-all actions
- [x] `src/components/layout/LeftPanel.tsx` — Test: panel sections render, resize handle
- [x] `src/components/layout/MainLayout.tsx` — Test: layout structure, panel visibility toggles

### 6f — Feature Components

- [x] `src/components/import/ImportDialog.tsx` — Test: file drop, tab switching, import button state, success/error feedback
- [x] `src/components/transform/TransformPage.tsx` — Test: input/output editors, run transform, error display
- [x] `src/components/json-compare/JsonComparePage.tsx` — Test: left/right inputs, diff rendering, empty state
- [x] `src/components/response/ErrorExplainer.tsx` — Test: renders correct explanation per error type, suggestion display
- [x] `src/components/history/` (logic components) — Test: history list renders, entry click opens tab, clear history
- [x] `src/components/hub/` — Test: hub listing renders, import hub item action
- [x] `src/components/common/` (shared logic components) — Test each component with logic

### 6g — Providers

- [x] `src/providers/AppProviders.tsx` — Test: all stores hydrate on mount, CronitorTracker initializes, toast provider renders

### 6h — Low Priority Components (60% coverage — test happy path only)

- [x] `src/components/chain/nodes/ChainNode.tsx`
- [x] `src/components/chain/nodes/ConditionNode.tsx`
- [x] `src/components/collections/HealthDot.tsx`
- [x] (+ 11 other minimal-logic chain node and dialog components): `DelayNode`, `DisplayNode`, `NodeToolbar`, `DeletableEdge`, `BlockMenu`, `ChainList`, `GhostNode`, `AutoLayoutControl`, `NodeContextMenu`, `GhostPlacementHandler`, `FormattedJsonResponseBody`

### Checkpoint 6
- [x] All component tests pass
- [ ] No test imports implementation internals (only public API)
- [ ] Use the [measured line coverage](#measured-line-coverage--tracked-sources) table as the backlog; phase **80%/60%** labels are targets, not current guarantees

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
- [ ] Should coverage thresholds be enforced in CI (`vitest --coverage`)? — **no**; track manually via `bun run test:coverage` and `node scripts/print-todo-coverage-table.cjs`
- [ ] Any files that need special setup (e.g., ReactFlow, CodeMirror) that require global mocks in vitest.setup.ts? - not sure you decide
