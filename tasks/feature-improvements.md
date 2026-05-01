# Implementation Plan: Feature Improvements

## Overview

16 features grouped into 4 phases — Quick Wins, High Impact, Medium Impact, and DX Polish. Each task is a vertical slice: types → store/lib → UI → wired end-to-end, leaving the app in a working state after every task. Foundation tasks (types, store shape changes) come first within each phase so dependent UI tasks can build on them.

## Architecture Decisions

- **OpenAPI parser** lives in `src/lib/openapiParser.ts` following the pattern of `insomniaParser.ts` — pure function, no side effects, returns `{ collection, requests }`.
- **Global headers/base URL** extend `AppSettings` in `useSettingsStore` rather than creating a new store — they are workspace-level preferences, not per-request state.
- **Response Assertions** reuse `evaluateAllAssertions()` from `src/lib/chainAssertions.ts` exactly as-is; a new `AssertionsTab` wraps it with non-scripting UI.
- **Secret masking** is UI-only state in `HeadersEditor` — the actual value is stored and sent unmasked; masking is purely visual.
- **Tab Groups / Pinning** extend the `TabState` and `RequestModel` types with optional fields — no breaking changes to existing persisted data.
- **SSL / Redirect toggles** are already present in `AppSettings` (`sslVerify`, `followRedirects`) and `ProxyRequest` (`followRedirects`) — the work is surfacing per-request overrides.

---

## Task List

### Phase 1: Quick Wins

---

- [x] **Task 1: OpenAPI / Swagger Import**

**Description:** Add a parser at `src/lib/openapiParser.ts` that accepts an OpenAPI 3.x or Swagger 2.x spec (YAML or JSON string) and returns `{ collection: CollectionModel, requests: RequestModel[] }`. Wire it into the existing Import dialog alongside the Insomnia importer.

**Acceptance criteria:**
- [x] Dropping or pasting a `.yaml` / `.json` OpenAPI spec in the Import dialog generates a collection with one `RequestModel` per operation
- [x] Method, URL (with path params as `{{param}}`), summary-as-name, example request bodies, and operation headers are mapped correctly
- [x] Invalid specs show a user-facing error toast rather than crashing

**Verification:**
- [x] `bun run test` — add unit tests in `src/lib/openapiParser.test.ts` covering GET/POST/path-params/invalid input
- [ ] Manual: import the public Petstore spec; confirm collection appears with correct request count

**Dependencies:** None

**Files likely touched:**
- `src/lib/openapiParser.ts` *(new)*
- `src/lib/openapiParser.test.ts` *(new)*
- `src/components/import/ImportDialog.tsx`
- `src/app/api/import/` *(if a server route is needed for YAML parsing)*

**Estimated scope:** M

---

- [x] **Task 2: Bulk `.env` File Import for Environments**

**Description:** Add an "Import .env" button inside `EnvManagerDialog` that opens a file picker, reads a `.env` file, parses `KEY=VALUE` lines (ignoring comments and blank lines), and bulk-sets variables into the active environment via `setVariable()`.

**Acceptance criteria:**
- [x] Clicking "Import .env" opens a native file picker filtered to `.env` / text files
- [x] Each `KEY=VALUE` line is parsed and written into the active environment
- [x] Lines starting with `#` and blank lines are silently skipped
- [x] A success toast shows how many variables were imported (e.g. "12 variables imported")
- [x] Duplicate keys overwrite the existing value

**Verification:**
- [ ] Manual: create a `.env` file with 5 vars + 2 comments; import it; confirm vars appear in the table

**Dependencies:** None

**Files likely touched:**
- `src/components/environment/EnvManagerDialog.tsx`
- `src/stores/useEnvironmentsStore.ts` *(possibly a `bulkSetVariables` action)*

**Estimated scope:** S

---

- [x] **Task 3: Global Base URL + Headers**

**Description:** Add `globalBaseUrl: string` and `globalHeaders: KVPair[]` to `AppSettings` in `useSettingsStore`. Expose them in a new "Global" tab inside Settings. In `useSendRequest`, prepend `globalBaseUrl` to any relative URL and merge `globalHeaders` before dispatching to the proxy, giving per-request headers precedence.

**Acceptance criteria:**
- [x] Settings → Global tab shows a base URL field and a KV headers table
- [x] A relative URL like `/users` is sent as `{baseUrl}/users` to the proxy
- [x] Global headers appear in the outgoing request; per-request headers with the same key override them
- [x] Settings persist across page refreshes via the existing `hydrate()` mechanism

**Verification:**
- [ ] Manual: set base URL to `https://jsonplaceholder.typicode.com`, open new request, type `/posts`, send — should hit the correct URL
- [ ] Manual: set global `Accept: application/json` header; confirm it appears in request headers in the response panel

**Dependencies:** None

**Files likely touched:**
- `src/stores/useSettingsStore.ts`
- `src/hooks/useSendRequest.ts`
- `src/components/settings/GeneralSection.tsx` *(or new `GlobalSection.tsx`)*

**Estimated scope:** M

---

- [x] **Task 4: Secret / Sensitive Value Masking**

**Description:** In `HeadersEditor`, add a per-row "mask" toggle (eye icon). When masked, the value cell renders `••••••••` with a reveal button. The masking state is local UI state — the actual value is always stored and sent in full. Pre-mask well-known sensitive header keys (`Authorization`, `X-API-Key`, `X-Auth-Token`) by default.

**Acceptance criteria:**
- [x] Each header row has an eye/eye-off icon toggle
- [x] When masked, the value displays as `••••••••`; clicking the eye reveals it temporarily
- [x] Headers matching `Authorization`, `X-API-Key`, `X-Auth-Token` (case-insensitive) default to masked on first render
- [x] The actual stored and sent value is never affected by the mask state

**Verification:**
- [ ] Manual: add an `Authorization: Bearer secret123` header — it should render masked by default; toggle reveals the value

**Dependencies:** None

**Files likely touched:**
- `src/components/request/HeadersEditor.tsx`

**Estimated scope:** S

---

- [x] **Task 5: Request Timeout Configuration**

**Description:** Add a `timeout: number` field (milliseconds, default `30000`) to `RequestModel` and `TabState`. Surface it as a number input in a new "Advanced" section within the request editor. Pass it to the proxy route, which uses `AbortController` + `setTimeout` to cancel the fetch.

**Acceptance criteria:**
- [x] An "Advanced" collapsible section in the request editor shows a timeout input (in seconds for UX, stored as ms)
- [x] Setting timeout to 1s and hitting a slow endpoint cancels with a user-visible timeout error
- [x] Default value of 30s applies to all existing requests with no stored timeout
- [x] Timeout is persisted in IndexedDB alongside other request fields

**Verification:**
- [ ] Manual: set timeout to 1s; send a request to `httpbin.org/delay/5` — should show a timeout error within ~1s
- [ ] Manual: existing requests load without any timeout input error (default applied)

**Dependencies:** None

**Files likely touched:**
- `src/types/index.ts`
- `src/stores/useTabsStore.ts`
- `src/app/api/proxy/route.ts`
- `src/hooks/useSendRequest.ts`
- `src/components/request/HttpTabs.tsx` *(or new `AdvancedTab.tsx`)*

**Estimated scope:** M

---

### Checkpoint: After Tasks 1–5
- [x] `bun run build` succeeds with no type errors
- [x] `bun run test` passes
- [x] Import dialog shows OpenAPI option
- [x] Env manager shows .env import button
- [x] Settings Global tab is accessible
- [x] Header masking works on Authorization rows
- [x] Timeout field appears in request editor

---

### Phase 2: High Impact / Medium Effort

---

- [ ] **Task 6: Response Assertions (No-Code Tests Tab)**

**Description:** Add a "Tests" tab to `ResponsePanel` (next to Timing). The tab renders a list of assertion rows — each with a source selector (`status`, `header`, `jsonpath`), operator (`eq`, `contains`, `exists`, etc.), and expected value input. After every request, run `evaluateAllAssertions()` from `src/lib/chainAssertions.ts` and display pass/fail badges per row plus a summary.

**Acceptance criteria:**
- [ ] "Tests" tab appears in `ResponsePanel` alongside Pretty / Raw / Headers / Timing
- [ ] Users can add/remove assertion rows without writing scripts
- [ ] After sending, each row shows a green ✓ or red ✗ badge with the actual value
- [ ] A summary line shows "3/3 passed" or "1/3 passed"
- [ ] Assertions are persisted per-request in IndexedDB

**Verification:**
- [ ] Manual: add assertion `status eq 200`; send a request to a 200 endpoint — should show green ✓
- [ ] Manual: add assertion `status eq 201`; send to a 200 endpoint — should show red ✗ with actual `200`

**Dependencies:** Task 5 (Advanced tab structure pattern)

**Files likely touched:**
- `src/components/response/ResponsePanel.tsx`
- `src/components/response/AssertionsTab.tsx` *(new)*
- `src/stores/useTabsStore.ts` *(add `assertions: ChainAssertion[]` to TabState)*
- `src/types/index.ts`
- `src/lib/chainAssertions.ts` *(reuse as-is)*

**Estimated scope:** M

---

- [ ] **Task 7: Tab Groups / Color Labels**

**Description:** Add an optional `group?: string` and `color?: string` field to `BaseTab` in `useTabsStore`. Right-clicking a tab shows a context menu option "Set Label" that opens a popover with color swatches and an optional group name. Tabs with the same group name are visually grouped in the tab bar with a faint separator.

**Acceptance criteria:**
- [ ] Right-click on any tab → "Set Label" menu item appears
- [ ] Label popover has 6 color swatches and a text input for group name
- [ ] Tabs with matching group names show a subtle visual grouping in the tab bar
- [ ] Color dot appears on the tab itself
- [ ] Group/color persists across refreshes via tab hydration

**Verification:**
- [ ] Manual: open 4 tabs, assign 2 to "Auth group" with blue color — they should show grouped in the tab bar

**Dependencies:** None

**Files likely touched:**
- `src/stores/useTabsStore.ts`
- `src/components/layout/Tab.tsx`
- `src/components/layout/TabBar.tsx`
- `src/components/layout/TabContextMenu.tsx`

**Estimated scope:** M

---

- [ ] **Task 8: Request Pinning**

**Description:** Add a `pinnedRequestIds: string[]` array to `AppSettings` in `useSettingsStore`. Right-clicking a request in the collection sidebar shows a "Pin to top" / "Unpin" toggle. Pinned requests appear in a dedicated "Pinned" section at the top of the sidebar, above collections.

**Acceptance criteria:**
- [ ] Right-click on a collection request → "Pin to top" option
- [ ] Pinned requests appear in a "Pinned" section above all collections in the sidebar
- [ ] Pinning/unpinning persists across refreshes
- [ ] Removing a request from a collection also removes it from pinned

**Verification:**
- [ ] Manual: pin 2 requests from different collections — both appear in "Pinned" section at top

**Dependencies:** None

**Files likely touched:**
- `src/stores/useSettingsStore.ts`
- `src/components/layout/SidebarMainTab.tsx`
- `src/components/collections/CollectionTree.tsx`

**Estimated scope:** S

---

- [ ] **Task 9: Follow Redirects + SSL Verification Toggles (Per-Request)**

**Description:** `AppSettings` already has global `sslVerify` and `followRedirects`. Add per-request overrides as optional fields on `RequestModel` and `TabState`. Surface them as toggles in the "Advanced" section added in Task 5. Pass them to the proxy route, which uses them to override global defaults.

**Acceptance criteria:**
- [ ] Advanced section in request editor shows "Follow Redirects" and "Verify SSL" toggles
- [ ] Per-request value takes precedence over global Settings value when set
- [ ] When not set on a request, the global Settings value is used (tri-state: on / off / inherit)
- [ ] Proxy route reads the per-request override and adjusts the fetch call accordingly

**Verification:**
- [ ] Manual: set global SSL verify = ON; set per-request SSL verify = OFF; send to a self-signed endpoint — should succeed
- [ ] Manual: leave per-request as "inherit" — global setting applies

**Dependencies:** Task 5 (Advanced section)

**Files likely touched:**
- `src/types/index.ts`
- `src/stores/useTabsStore.ts`
- `src/stores/useSettingsStore.ts`
- `src/app/api/proxy/route.ts`
- `src/components/request/HttpTabs.tsx` *(Advanced section)*

**Estimated scope:** S

---

### Checkpoint: After Tasks 6–9
- [ ] `bun run build` succeeds
- [ ] Tests tab appears in ResponsePanel and assertions evaluate correctly
- [ ] Tab color labels persist
- [ ] Pinned requests appear in sidebar
- [ ] Per-request SSL/redirect toggles work

---

### Phase 3: Medium Impact

---

- [ ] **Task 10: GraphQL Schema Introspection & Explorer**

**Description:** In the GraphQL tab, add a "Schema" panel (collapsible, right side) with a "Fetch Schema" button. Clicking it runs the standard GraphQL introspection query through the proxy and renders a searchable, collapsible tree of types, queries, mutations, and fields with their types.

**Acceptance criteria:**
- [ ] GraphQL tab has a "Schema" toggle button in its toolbar
- [ ] "Fetch Schema" sends the introspection query and parses the response
- [ ] Schema renders as a collapsible tree: Queries → fields, Mutations → fields, Types → fields
- [ ] Each field shows its type (e.g. `String!`, `[User]`)
- [ ] Clicking a field name inserts it at cursor in the query editor

**Verification:**
- [ ] Manual: point to `https://countries.trevorblades.com/`; fetch schema; tree should show Query type with `countries`, `country`, `continent` fields

**Dependencies:** None

**Files likely touched:**
- `src/components/request/GraphQLTabs.tsx`
- `src/components/request/GraphQLSchemaExplorer.tsx` *(new)*
- `src/lib/graphqlIntrospection.ts` *(new)*

**Estimated scope:** M

---

- [ ] **Task 11: Environment Variable Validation Before Send**

**Description:** In `useSendRequest`, before dispatching the request, scan the resolved URL, headers, and body for any remaining `{{variable}}` placeholders (after `resolveVariables()` runs). If any are found, show a dismissible warning banner above the response panel listing the unresolved variables. The user can still send.

**Acceptance criteria:**
- [ ] If any `{{var}}` remains unresolved after variable substitution, an orange warning banner appears
- [ ] Banner lists the specific unresolved variable names, e.g. "Unresolved variables: `base_url`, `token`"
- [ ] Banner has a "Send anyway" confirmation and a "Fix" link that opens the Environment Manager
- [ ] When all variables resolve, no banner is shown

**Verification:**
- [ ] Manual: add header `Authorization: Bearer {{token}}`; do not define `token` in env; send — banner should appear listing `token`
- [ ] Manual: define `token` in env; send — no banner

**Dependencies:** None

**Files likely touched:**
- `src/hooks/useSendRequest.ts`
- `src/components/response/ResponsePanel.tsx` *(banner placement)*
- `src/stores/useUIStore.ts` *(or local state in panel)*

**Estimated scope:** S

---

- [ ] **Task 12: Export History as CSV / JSON**

**Description:** Add an "Export" button to the History panel. A dropdown lets the user choose CSV or JSON. The export serializes all history entries from IndexedDB (url, method, status, duration, timestamp, requestId) and triggers a browser download.

**Acceptance criteria:**
- [ ] History panel has an "Export" button
- [ ] CSV export produces a properly quoted CSV with headers: `timestamp,method,url,status,duration_ms`
- [ ] JSON export produces an array of history objects
- [ ] Download is triggered as a browser file download with a timestamped filename (e.g. `requestly-history-2026-04-29.csv`)

**Verification:**
- [ ] Manual: make 3 requests; export as CSV; open in spreadsheet — 3 data rows with correct values
- [ ] Manual: export as JSON; parse in browser console — valid array

**Dependencies:** None

**Files likely touched:**
- `src/components/history/` *(existing history panel component)*
- `src/lib/historyExport.ts` *(new)*

**Estimated scope:** S

---

- [ ] **Task 13: Request Templates Gallery**

**Description:** Add a "New from Template" option to the `CreateNewDropdown`. Clicking it opens a modal grid of template cards. Selecting a template creates a new tab pre-populated with the template's method, URL, headers, and body. Initial templates: REST CRUD set, Bearer auth, Multipart file upload, Webhook (POST with JSON payload).

**Acceptance criteria:**
- [ ] "New from Template" appears in the create dropdown
- [ ] Template gallery modal shows cards with template name, method badge, and brief description
- [ ] Selecting a template opens a new tab with pre-filled fields
- [ ] Templates are defined as static data (no network call needed)

**Verification:**
- [ ] Manual: select "Bearer Auth" template — new tab should have `Authorization: Bearer {{token}}` header pre-filled
- [ ] Manual: select "Multipart File Upload" template — body type should be `form-data`

**Dependencies:** None

**Files likely touched:**
- `src/components/layout/CreateNewDropdown.tsx`
- `src/components/request/TemplateGalleryModal.tsx` *(new)*
- `src/lib/requestTemplates.ts` *(new — static template definitions)*

**Estimated scope:** M

---

- [ ] **Task 14: Postman Collection v2.1 Export**

**Description:** Add an "Export as Postman" option to each collection's context menu in the sidebar. A `postmanExporter.ts` lib function converts `CollectionModel` + `RequestModel[]` to the Postman Collection v2.1 JSON schema and triggers a browser download.

**Acceptance criteria:**
- [ ] Right-clicking a collection in the sidebar shows "Export → Postman Collection"
- [ ] Exported JSON validates against the Postman Collection v2.1 schema
- [ ] Method, URL, headers, query params, body (raw/form), and auth are mapped correctly
- [ ] Download filename is `{collection-name}.postman_collection.json`

**Verification:**
- [ ] Manual: create a collection with 3 requests (GET, POST with JSON body, POST with Bearer auth); export; import into Postman — all 3 requests should appear correctly
- [ ] Manual: exported JSON has `"info": { "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" }`

**Dependencies:** None

**Files likely touched:**
- `src/lib/postmanExporter.ts` *(new)*
- `src/components/collections/CollectionTree.tsx` *(context menu)*

**Estimated scope:** M

---

### Checkpoint: After Tasks 10–14
- [ ] `bun run build` succeeds
- [ ] GraphQL schema explorer renders for public endpoints
- [ ] Unresolved variable banner appears and links to env manager
- [ ] History exports download correctly in CSV and JSON
- [ ] Template gallery creates properly pre-filled tabs
- [ ] Postman export opens in Postman without errors

---

### Phase 4: DX Polish

---

- [ ] **Task 15: In-App Script Linting**

**Description:** In `ScriptEditor` (pre/post request), add a "Check Syntax" button that runs the script content through a lightweight JS syntax check (using `new Function()` try/catch or `acorn` if already available). Show inline error markers or an error banner with line/column if invalid.

**Acceptance criteria:**
- [ ] "Check Syntax" button appears in the ScriptEditor toolbar
- [ ] Valid JS shows a green "✓ No errors" toast
- [ ] Invalid JS (syntax error) shows the error message with line and column number
- [ ] The check is purely client-side — no server round-trip

**Verification:**
- [ ] Manual: type `const x = {` in script editor; click "Check Syntax" — should show `SyntaxError: Unexpected end of input`
- [ ] Manual: type `const x = 1 + 1;`; click "Check Syntax" — should show no errors

**Dependencies:** None

**Files likely touched:**
- `src/components/request/ScriptEditor.tsx`
- `src/lib/scriptLinter.ts` *(new — thin wrapper around try/catch + new Function)*

**Estimated scope:** S

---

- [ ] **Task 16: Improved Empty States with Sample Requests**

**Description:** When the history list is empty and when collections contain no requests, replace the generic empty state with an interactive one that shows 3–4 clickable "Try it" sample request cards (e.g. JSONPlaceholder GET /posts, httpbin.org/get, a public GraphQL endpoint). Clicking a card opens that request in a new tab.

**Acceptance criteria:**
- [ ] Empty history panel shows sample request cards instead of a blank message
- [ ] Empty collections sidebar shows a "Try a sample request" section
- [ ] Clicking a sample card opens a pre-filled tab (same as a template) and focuses it
- [ ] Once history/collections have entries, the empty state is not shown

**Verification:**
- [ ] Manual: fresh app with no history — empty state shows sample cards
- [ ] Manual: click "GET /posts (JSONPlaceholder)" — new tab opens with correct URL and method
- [ ] Manual: after making one request, empty state disappears from history

**Dependencies:** Task 13 (template open-tab pattern can be reused)

**Files likely touched:**
- `src/components/common/EmptyState.tsx`
- `src/components/history/` *(history panel)*
- `src/components/layout/SidebarMainTab.tsx`

**Estimated scope:** S

---

### Checkpoint: Complete
- [ ] `bun run build` — zero errors
- [ ] `bun run test` — all unit tests pass
- [ ] Script linting shows errors on invalid JS
- [ ] Empty states show sample cards and clicking them opens correct tabs
- [ ] Full manual smoke-test: import OpenAPI spec → send request → check assertions → export history

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAPI YAML parsing requires a server-side parser (no browser YAML native) | Med | Use `js-yaml` (check if already a dep); if not, parse YAML in a Next.js API route |
| `evaluateAllAssertions` takes `ChainAssertion` type — may need adaptation for HTTP-only assertions | Med | Reuse `ChainAssertion` type directly; it already covers `status`, `header`, `jsonpath` sources |
| Proxy route SSL toggle may be ignored by `node-fetch` or native fetch depending on the runtime | Med | Use `https.Agent({ rejectUnauthorized: false })` in the proxy route; document the limitation |
| Postman v2.1 schema has edge cases for nested folders | Low | Start with flat collection export; nested folders can be a follow-up |
| Global base URL conflicts with absolute URLs users already have | Low | Only prepend if the request URL starts with `/` or has no scheme |

## Open Questions

- Should OpenAPI import also create environments from `servers[].url` entries?
- Should template gallery be extensible (user-defined templates) in this iteration, or static only?
- For the GraphQL schema explorer, should clicking a field name append to the query editor or replace it?
