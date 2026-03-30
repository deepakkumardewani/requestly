# TASKS.md — Requestly: 10 New Differentiating Features

**Version:** 1.0
**Date:** 2026-03-17

---

## Dependency Installation (Do First)

```bash
npm install @codemirror/lang-markdown marked @xyflow/react
```

| Package | Version | Used by |
|---|---|---|
| `@codemirror/lang-markdown` | latest | Epic 9 — Annotated Collections (markdown editor) |
| `marked` | latest | Epic 9 — Docs Export (markdown → HTML rendering) |
| `@xyflow/react` | latest | Epic 10 — Chaining UI canvas (React Flow) |

All other features use native browser APIs, existing CodeMirror setup, or hand-rolled utilities. No other new npm packages required.

---

## Epic 1 — Code Generation Panel

**Estimated time:** 4–5 hours
**Complexity:** Low
**New files:** `lib/codeGenerators.ts`, `components/request/CodeGenPanel.tsx`
**Modified files:** `components/layout/RightPanel.tsx`, `store/settingsStore.ts`

---

### Task 1.1 — Create code generator library (`lib/codeGenerators.ts`)

- [ ] Define `CodeGenRequest` type:
  ```ts
  type CodeGenRequest = {
    method: string
    url: string
    headers: KVPair[]
    params: KVPair[]
    body: BodyConfig
    auth: AuthConfig
  }
  ```
- [ ] Implement `generateCurl(req, resolvedVars?): string`
  - Build: `curl -X {METHOD} '{url}' \`
  - Append each enabled header: `  -H '{key}: {value}' \`
  - Append body if present: `  --data '{content}'`
- [ ] Implement `generateFetch(req, resolvedVars?): string`
  - Build `fetch(url, { method, headers: {...}, body: ... })` template
  - Include `await response.json()` boilerplate
- [ ] Implement `generateAxios(req, resolvedVars?): string`
  - Build `axios({ method, url, headers, data })` template
- [ ] Implement `generatePython(req, resolvedVars?): string`
  - Build `import requests` + `requests.{method}(url, headers=..., json=...)` template
- [ ] Implement `generateGo(req, resolvedVars?): string`
  - Build `net/http` template with `http.NewRequest`, header setting, body reader
- [ ] Implement `resolveVars(req, env): CodeGenRequest`
  - Replace `{{VAR}}` with env value; replace secret vars with `<REDACTED>`
  - Return original req unchanged if `resolvedVars` flag not set
- [ ] Write unit tests for each generator with a sample request (`lib/codeGenerators.test.ts`)

---

### Task 1.2 — Build `CodeGenPanel` component (`components/request/CodeGenPanel.tsx`)

- [ ] Collapsible panel; default collapsed; preference stored in `settingsStore.showCodeGen`
- [ ] Header: "Code" label + language tab strip + "Resolve Variables" toggle + collapse chevron
- [ ] Language tabs: `cURL | fetch | axios | Python | Go`
- [ ] Active tab stored in local component state (not persisted to store)
- [ ] CodeMirror 6 read-only viewer for generated code (`editable: false`)
  - JS language for fetch/axios; Python language for Python; plain text for cURL/Go
- [ ] "Copy" icon button top-right of editor; copies current snippet; shows "Copied ✓" for 1.5s
- [ ] Regenerates on every prop change (method, url, headers, params, body, auth, activeEnv)
- [ ] When "Resolve Variables" toggled on: call `resolveVars`; secret vars show `<REDACTED>`

---

### Task 1.3 — Wire into `RightPanel`

- [ ] In `RightPanel.tsx`: render `<CodeGenPanel />` between RequestTabs and ResponsePanel
- [ ] Pass current tab's request state + active environment from stores
- [ ] Gate render on `settingsStore.showCodeGen` (default `true`)

---

### Task 1.4 — Settings toggle

- [ ] Add `showCodeGen: boolean` to `settingsStore` (default `true`)
- [ ] Add toggle in `app/settings/page.tsx` under "Features" section: "Show Code Generation panel"

---

### Task 1.5 — Manual test

- [ ] Build a POST request with headers, body, auth → all 5 snippets generate correctly
- [ ] Change method to DELETE → all snippets update live with no stale state
- [ ] Toggle "Resolve Variables" with active env → `{{VAR}}` replaced in snippets
- [ ] Secret variable → shows `<REDACTED>` even when resolve is on
- [ ] Copy cURL snippet → paste in terminal → request executes correctly

---

## Epic 2 — Diff Two Environments

**Estimated time:** 4–5 hours
**Complexity:** Low-medium (reuses existing diff component)
**New files:** `components/request/EnvDiffModal.tsx`
**Modified files:** `components/request/UrlBar.tsx`, `lib/requestRunner.ts`

---

### Task 2.1 — Parallel request runner (`lib/requestRunner.ts`)

- [ ] Add `runRequestWithEnv(req: RequestModel, env: EnvironmentModel): Promise<ResponseData>`
  - Resolve `{{VAR}}` using given env
  - Fire via existing `/api/proxy` route handler
  - Return `ResponseData`
- [ ] Add `runParallel(req, envA, envB): Promise<[ResponseData, ResponseData]>`
  - `Promise.all([runRequestWithEnv(req, envA), runRequestWithEnv(req, envB)])`

---

### Task 2.2 — Build `EnvDiffModal` component (`components/request/EnvDiffModal.tsx`)

- [ ] shadcn Dialog; large size (max-w-5xl)
- [ ] Header: "Compare Environments" + close button
- [ ] Two environment selectors (shadcn Select, populated from `environmentsStore`)
  - Default: env A = active environment; env B = first other environment
  - Validation: env A and env B must differ; "Run Comparison" disabled if same
- [ ] "Run Comparison" button fires `runParallel`; shows spinner during run
- [ ] Results section (shown after run):
  - Two column headers: `{envA name} — {statusCode} — {time}ms` / `{envB name} — ...`
  - Slower env time highlighted in amber if delta > 200ms
  - Side-by-side diff using `diffJson` from `lib/diffJson.ts`
  - If responses identical: green banner "✓ Responses are identical"
  - If one request errors: show error message in that column; diff still shown for other
- [ ] Error states: network failure per column shown inline

---

### Task 2.3 — "Compare Envs" button in `UrlBar`

- [ ] Add icon button (fork/split icon from lucide-react) to `UrlBar.tsx` right of Send
- [ ] Disabled if fewer than 2 environments exist in `environmentsStore`
- [ ] On click: open `EnvDiffModal` passing current request from active tab
- [ ] Tooltip: "Compare response across two environments"

---

### Task 2.4 — Manual test

- [ ] Create two environments with different `BASE_URL` values pointing to different hosts
- [ ] Open modal; select both envs; run → both responses shown; diffs highlighted
- [ ] Make one env intentionally slower; confirm amber timing label
- [ ] Make responses identical → green "identical" banner shown
- [ ] Test with only 1 env configured → "Compare Envs" button is disabled

---

## Epic 3 — "Why Did This Fail?" Explainer

**Estimated time:** 3–4 hours
**Complexity:** Low
**New files:** `lib/errorExplainer.ts`, `components/response/ErrorExplainer.tsx`
**Modified files:** `components/response/ResponsePanel.tsx`, `store/settingsStore.ts`

---

### Task 3.1 — Build error knowledge base (`lib/errorExplainer.ts`)

- [ ] Define types:
  ```ts
  type BodyPattern = { keyword: string; hint: string }
  type ErrorExplanation = {
    title: string
    cause: string
    suggestions: string[]
    mdnUrl: string
    bodyPatterns: BodyPattern[]
  }
  ```
- [ ] Build `ERROR_MAP: Record<number, ErrorExplanation>` for these status codes:
  - `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found
  - `405` Method Not Allowed, `408` Request Timeout, `409` Conflict, `410` Gone
  - `422` Unprocessable Entity, `429` Too Many Requests
  - `500` Internal Server Error, `502` Bad Gateway, `503` Service Unavailable, `504` Gateway Timeout
- [ ] Each entry includes 2–4 concrete `suggestions` and relevant `bodyPatterns`
  - e.g. 401 patterns: `expired → "Your token may have expired"`, `invalid_token → "Token format may be incorrect"`, `unauthorized → "Check your API key is correct"`
  - e.g. 429 patterns: `rate limit → "You are exceeding the API's rate limit — add delays or reduce request frequency"`
- [ ] Implement `explainError(status: number, body: string): ErrorExplanation | null`
  - Returns `null` for status < 400
  - Looks up base explanation from `ERROR_MAP`; returns `null` if status not in map
  - Scans `body.toLowerCase()` for each `bodyPattern.keyword` (case-insensitive substring)
  - Returns explanation with matched hints appended to `suggestions`

---

### Task 3.2 — Build `ErrorExplainer` component (`components/response/ErrorExplainer.tsx`)

- [ ] Collapsible panel; auto-expands controlled by `settingsStore.autoExpandExplainer`
- [ ] Never rendered when `status < 400` or `status` is null
- [ ] Header: "⚠ Why did this fail?" label + collapse chevron + dismiss X button
- [ ] Body:
  - Bold title: e.g. "403 Forbidden"
  - Cause paragraph (plain text)
  - Bulleted suggestions list
  - If body pattern matched: amber callout box with matched hint text
  - "MDN docs for {status} →" external link (opens in new tab)
- [ ] Dismiss X: hides panel for current response only; reappears on next response received

---

### Task 3.3 — Wire into `ResponsePanel`

- [ ] In `ResponsePanel.tsx`: render `<ErrorExplainer />` between meta row and response tabs
- [ ] Pass `status` and `body` from `responseStore` for active tab
- [ ] Only mount when `status >= 400`

---

### Task 3.4 — Settings

- [ ] Add `autoExpandExplainer: boolean` to `settingsStore` (default `true`)
- [ ] Add toggle in settings: "Auto-expand error explainer on failed requests"

---

### Task 3.5 — Manual test

- [ ] Send request to non-existent URL → 404 panel shown with correct suggestions
- [ ] Send request with expired token where body contains "expired" → amber hint shown
- [ ] Send successful 200 request → explainer not shown
- [ ] Dismiss explainer → hidden; send same request → reappears

---

## Epic 4 — HAR Replay

**Estimated time:** 6–7 hours
**Complexity:** Medium
**New files:** `lib/harParser.ts`, `components/import/HarImporter.tsx`, `components/common/RunTimeline.tsx`
**Modified files:** `app/import/page.tsx`

---

### Task 4.1 — HAR parser (`lib/harParser.ts`)

- [ ] Define `HarEntry` type:
  ```ts
  type HarEntry = {
    id: string
    index: number
    method: string
    url: string
    headers: KVPair[]
    body: string | null
    mimeType: string
    startedAt: number
    duration: number
    resourceType: string
  }
  ```
- [ ] Implement `parseHar(harJson: object): HarEntry[]`
  - Walk `log.entries`
  - Extract method, url, request headers (exclude `:authority`, `:method`, `:path`, `:scheme` pseudo-headers)
  - Extract `postData.text` as body; `postData.mimeType` as mimeType
  - Compute `startedAt` as ms offset from first entry's `startedDateTime`
  - Extract `_resourceType` field if present; default to `'other'`
- [ ] Implement `filterHarEntries(entries: HarEntry[]): HarEntry[]`
  - Keep: `resourceType` in `['xhr', 'fetch', 'websocket', 'other']`
  - Exclude: `['image', 'stylesheet', 'font', 'script', 'media', 'document']`
- [ ] Write unit tests with a minimal HAR fixture (`lib/harParser.test.ts`)

---

### Task 4.2 — Build `RunTimeline` component (`components/common/RunTimeline.tsx`)

> Shared component — also used by Epic 8 (Collection Run). Build here first.

- [ ] Define props:
  ```ts
  type RunTimelineItem = {
    id: string
    name: string
    method: string
    url: string
    status: number | null
    duration: number | null
    state: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
    responseBody?: string
    error?: string
  }
  type RunTimelineProps = {
    items: RunTimelineItem[]
    isRunning: boolean
    onStop: () => void
    onExportReport?: () => void
  }
  ```
- [ ] Vertical list; each row: method badge, name (truncated), state icon, status badge, duration
- [ ] Running row: animated spinner (CSS animation, no library)
- [ ] Passed: green checkmark icon; Failed: red X icon; Skipped: grey dash; Pending: grey dot
- [ ] Clicking a failed row: expands inline to show response body (first 500 chars) or error message
- [ ] Summary footer: "X passed · Y failed · Z skipped · {total}ms total"
- [ ] "Stop" button visible while `isRunning`; calls `onStop`
- [ ] "Export Report" button visible after run completes if `onExportReport` provided

---

### Task 4.3 — Build `HarImporter` component (`components/import/HarImporter.tsx`)

- [ ] Drag-and-drop zone + file picker; accept `.har` files only
- [ ] On file drop: `FileReader.readAsText` → `JSON.parse` → `parseHar` → `filterHarEntries`
- [ ] Parsed entry list: checkbox per entry, method badge, URL (truncated), duration badge
- [ ] "Select All" / "Deselect All" buttons
- [ ] "Show all resource types" toggle — when on: re-run without `filterHarEntries`
- [ ] Entry count summary: "Showing {n} of {total} entries (static assets filtered)"
- [ ] "Replay Selected ({n})" button; disabled if 0 selected
- [ ] On replay: fire selected entries sequentially using `runRequest`; feed results into `RunTimeline`
- [ ] Abort controller wired to `RunTimeline`'s "Stop" button
- [ ] "Save to Collection" button after replay: prompts for collection name; saves selected entries
- [ ] Parse error state: red banner "Invalid HAR file — could not parse"

---

### Task 4.4 — Wire into `/import` page

- [ ] In `app/import/page.tsx`: add "HAR File" tab alongside existing import options
- [ ] Render `<HarImporter />` in the HAR tab panel

---

### Task 4.5 — Manual test

- [ ] Export a HAR from Chrome DevTools on any website
- [ ] Drop into importer → XHR/fetch entries listed; static assets filtered
- [ ] Toggle "Show all" → all entry types appear
- [ ] Deselect 2 entries; replay remaining → `RunTimeline` shows results
- [ ] Click a failing entry → response body shown inline
- [ ] Save to collection → new collection created; verify in left panel

---

## Epic 5 — Request Timing Waterfall

**Estimated time:** 3–4 hours
**Complexity:** Low-medium
**New files:** `components/response/TimingWaterfall.tsx`, `lib/timingParser.ts`
**Modified files:** `app/api/proxy/route.ts`, `lib/requestRunner.ts`, `components/response/ResponsePanel.tsx`, `types/response.ts`

---

### Task 5.1 — Expose timing data from proxy (`app/api/proxy/route.ts`)

- [ ] Record `t0 = performance.now()` before `fetch(url)`
- [ ] After response received: record `ttfb = performance.now() - t0`
- [ ] After body fully read: record `total = performance.now() - t0`
- [ ] Compute `download = total - ttfb`
- [ ] Append custom headers to proxy response:
  ```
  X-Timing-TTFB: {ttfb}
  X-Timing-Download: {download}
  X-Timing-Total: {total}
  ```
- [ ] DNS, TCP, TLS: not measurable from Node.js fetch; omit (handled as null in parser)

---

### Task 5.2 — Parse timing (`lib/timingParser.ts`)

- [ ] Define `TimingData`:
  ```ts
  type TimingData = {
    dns: number | null
    tcp: number | null
    tls: number | null
    ttfb: number
    download: number
    total: number
  }
  ```
- [ ] Implement `parseTimingHeaders(headers: Record<string,string>, totalDuration: number): TimingData`
  - Read `x-timing-ttfb`, `x-timing-download`, `x-timing-total` (lowercase — headers are lowercased by fetch)
  - If headers missing: estimate `ttfb = totalDuration * 0.8`, `download = totalDuration * 0.2`
  - DNS, TCP, TLS always `null` (not measurable server-side)
- [ ] Add `timing: TimingData` to `ResponseData` type in `types/response.ts`
- [ ] In `useSendRequest`: call `parseTimingHeaders` and attach to `ResponseData`

---

### Task 5.3 — Build `TimingWaterfall` component (`components/response/TimingWaterfall.tsx`)

- [ ] Props: `timing: TimingData`
- [ ] Hand-rolled SVG horizontal waterfall (no library needed)
- [ ] Segment colours:
  - DNS: slate (or "N/A" grey stripe if null)
  - TCP: indigo (or "N/A" if null)
  - TLS: purple (or "N/A" if null)
  - TTFB: amber
  - Download: emerald
- [ ] Each segment: width proportional to its share of total time
- [ ] N/A segments: grey striped pattern; 0px width but labelled
- [ ] Hover on segment: shadcn Tooltip showing label + exact ms value
- [ ] Labels row below bar: segment name + ms value for each
- [ ] Total time shown right-aligned: "Total: {n}ms"

---

### Task 5.4 — Add "Timing" tab to response panel

- [ ] In `ResponsePanel.tsx`: add "Timing" tab to response tabs row (after "Cookies")
- [ ] Render `<TimingWaterfall timing={response.timing} />` in Timing tab content
- [ ] Tab only visible when a response exists (`response !== null`)

---

### Task 5.5 — Manual test

- [ ] Send any request → Timing tab visible → waterfall renders
- [ ] Hover each segment → tooltip shows label and ms
- [ ] Send request to a slow endpoint → TTFB segment visibly dominates
- [ ] N/A segments (DNS, TCP, TLS) render as grey stripes with label

---

## Epic 6 — Offline Cached Responses

**Estimated time:** 5–6 hours
**Complexity:** Medium (Service Worker + Cache API)
**New files:** `public/sw.js`, `lib/serviceWorker.ts`
**Modified files:** `app/layout.tsx`, `lib/requestRunner.ts`, `store/responseStore.ts`, `components/response/ResponsePanel.tsx`

---

### Task 6.1 — Create Service Worker (`public/sw.js`)

- [ ] Cache name: `requestly-response-cache-v1`
- [ ] Listen for `message` events:
  - `{ type: 'CACHE_RESPONSE', key, data }` → store in Cache API as JSON
  - `{ type: 'GET_CACHED', key }` → reply with cached data or `null`
  - `{ type: 'CLEAR_CACHE' }` → delete all entries; reply with `{ cleared: true }`
  - `{ type: 'GET_CACHE_SIZE' }` → reply with entry count
- [ ] LRU eviction: after `CACHE_RESPONSE`, list all keys; if count > 200, delete oldest by timestamp
- [ ] Cache entries stored as: `{ data: ResponseData, cachedAt: number }`

---

### Task 6.2 — Service Worker registration (`lib/serviceWorker.ts`)

- [ ] `registerServiceWorker(): Promise<void>` — register `/sw.js` if supported; log result
- [ ] `cacheResponse(method, url, data): Promise<void>` — post `CACHE_RESPONSE` to SW
- [ ] `getCachedResponse(method, url): Promise<{ data: ResponseData, cachedAt: number } | null>` — post `GET_CACHED`; await `MessageChannel` reply
- [ ] `clearResponseCache(): Promise<void>` — post `CLEAR_CACHE`
- [ ] Call `registerServiceWorker()` in `app/layout.tsx` in a client-side `useEffect`

---

### Task 6.3 — Integrate with `useSendRequest`

- [ ] After successful response: call `cacheResponse(method, url, responseData)`
- [ ] On network error (fetch throws or proxy returns network-level error):
  - Call `getCachedResponse(method, url)`
  - If cache hit: set response in `responseStore` with `isOfflineCached: true`, `cachedAt` timestamp
  - If no cache: set error state "Network error — no cached response available"

---

### Task 6.4 — Offline banner in `ResponsePanel`

- [ ] Add `isOfflineCached: boolean` and `cachedAt: number | null` to `ResponseData` type
- [ ] In `ResponsePanel.tsx`: if `response.isOfflineCached`, show amber banner above tabs:
  - "Offline — showing cached response from {relative time, e.g. '2 hours ago'}"
  - "Retry" button: re-triggers request; disabled if still offline (detected via `navigator.onLine`)
- [ ] Response meta row: show "CACHED" pill badge instead of response time

---

### Task 6.5 — Settings: clear cache

- [ ] In `app/settings/page.tsx`, Data Management section: add "Clear Response Cache" button
- [ ] On click: call `clearResponseCache()` → success toast "Response cache cleared"

---

### Task 6.6 — Manual test

- [ ] Send a request → DevTools → Network → set Offline → send again → cached response with banner
- [ ] Banner shows correct relative timestamp
- [ ] Go back online → click Retry → live response fetched; banner disappears
- [ ] Clear cache in Settings → go offline → send → "no cached response" error shown
- [ ] Send 201 unique requests → confirm LRU evicts oldest (cache stays at 200)

---

## Epic 7 — Changelog Detection

**Estimated time:** 4–5 hours
**Complexity:** Medium
**New files:** `lib/changelogDetector.ts`, `components/layout/ChangesPanel.tsx`
**Modified files:** `store/uiStore.ts`, `app/page.tsx`, `components/layout/LeftPanel.tsx`

---

### Task 7.1 — Detection engine (`lib/changelogDetector.ts`)

- [ ] Define `DetectedChange`:
  ```ts
  type DetectedChange = {
    id: string
    key: string
    summary: string
    oldEntryId: string
    newEntryId: string
    oldCapturedAt: number
    newCapturedAt: number
    diffs: DiffEntry[]
    dismissed: boolean
  }
  ```
- [ ] Implement `detectChanges(history: HistoryEntry[]): DetectedChange[]`
  - Group entries by `healthKey(method, url)` (reuse from `lib/healthMonitor.ts`)
  - Skip groups with < 5 entries total
  - For each group:
    - `newEntry` = most recent entry
    - `oldEntry` = most recent entry where `sentAt < Date.now() - 7 * 24 * 60 * 60 * 1000`
    - Skip group if no `oldEntry` found
    - Parse both response bodies as JSON; skip if either is not valid JSON
    - Run `diffJson(oldParsed, newParsed)`
    - If `diffs.length > 0`: create `DetectedChange` with summary string
  - Cap at 50 groups processed (performance guard)
  - Return array of changes

---

### Task 7.2 — Store in `uiStore`

- [ ] Add to `store/uiStore.ts`:
  ```ts
  detectedChanges: DetectedChange[]
  setDetectedChanges(changes: DetectedChange[]): void
  dismissChange(id: string): void
  clearAllChanges(): void
  ```
- [ ] Not persisted to IndexedDB — session-only; re-detected on next app open

---

### Task 7.3 — Trigger detection on app open (`app/page.tsx`)

- [ ] In main page `useEffect` (runs once on mount):
  ```ts
  requestIdleCallback(() => {
    const changes = detectChanges(historyStore.history)
    uiStore.setDetectedChanges(changes)
  })
  ```
- [ ] Falls back to `setTimeout(..., 2000)` if `requestIdleCallback` not supported

---

### Task 7.4 — Build `ChangesPanel` component (`components/layout/ChangesPanel.tsx`)

- [ ] Hidden entirely if `detectedChanges.length === 0`
- [ ] Header: "API Changes" label + count badge + "Clear all" button
- [ ] Each change row:
  - Method badge + normalised URL (truncated to 40 chars)
  - Summary: "3 changed · 1 added · 2 removed"
  - Relative age: "vs. 8 days ago"
  - Dismiss X button (appears on hover)
  - Click row → open `SnapshotDiffModal` with `oldEntry.response.body` as golden, `newEntry.response.body` as current
- [ ] Dismiss calls `uiStore.dismissChange(id)` → row removed immediately

---

### Task 7.5 — Wire into `LeftPanel`

- [ ] In `LeftPanel.tsx`: render `<ChangesPanel />` below `HistoryList`
- [ ] If changes exist: show small red count badge on a "Changes" section label

---

### Task 7.6 — Manual test

- [ ] Manually insert history entries via IndexedDB (or send real requests on two different days)
- [ ] Modify one response to have a different JSON structure
- [ ] Refresh app → change appears in Changes panel
- [ ] Click change → diff modal opens showing structural difference
- [ ] Dismiss → row removed; dismiss all → panel hidden

---

## Epic 8 — Collection Run + Timeline

**Estimated time:** 4–5 hours
**Complexity:** Medium (reuses `RunTimeline` from Epic 4)
**New files:** `lib/collectionRunner.ts`, `components/collections/CollectionRunModal.tsx`
**Modified files:** `components/collections/CollectionItem.tsx`

---

### Task 8.1 — Collection runner engine (`lib/collectionRunner.ts`)

- [ ] Define types:
  ```ts
  type CollectionRunCallbacks = {
    onItemStart: (requestId: string) => void
    onItemComplete: (requestId: string, item: RunTimelineItem) => void
    onComplete: (summary: RunSummary) => void
  }
  type RunSummary = {
    passed: number; failed: number; skipped: number; totalDuration: number
  }
  ```
- [ ] Implement `runCollection(requests: RequestModel[], envId: string | null, callbacks: CollectionRunCallbacks, signal: AbortSignal): Promise<void>`
  - Iterate requests in array order
  - Before each: check `signal.aborted`; if true mark remaining as `skipped`, call `onComplete`
  - Call `callbacks.onItemStart(request.id)`
  - Resolve env vars; fire via `runRequestWithEnv`
  - Pass = 2xx status; Fail = anything else or thrown error
  - Call `callbacks.onItemComplete(request.id, result)`
  - After last request: compute summary; call `callbacks.onComplete(summary)`

---

### Task 8.2 — Build `CollectionRunModal` (`components/collections/CollectionRunModal.tsx`)

- [ ] shadcn Dialog; large (max-w-3xl); non-closeable while run is active
- [ ] Header: "Run: {collectionName}" + environment selector (all envs + "No environment") + close button
- [ ] Body: `<RunTimeline items={items} isRunning={isRunning} onStop={handleStop} onExportReport={handleExport} />`
- [ ] "Run" button starts run; replaced by "Stop" during run
- [ ] Abort controller created on run start; cancelled on stop
- [ ] React state: `items: RunTimelineItem[]` initialized as all-`pending` from collection requests

---

### Task 8.3 — JSON report export

- [ ] `handleExport()` in `CollectionRunModal`:
  - Build report object:
    ```json
    {
      "collectionName": "...",
      "runAt": "ISO timestamp",
      "environment": "env name or null",
      "summary": { "passed": 0, "failed": 0, "skipped": 0, "totalDuration": 0 },
      "results": [{ "name": "", "method": "", "url": "", "status": 0, "duration": 0, "passed": true }]
    }
    ```
  - `JSON.stringify(report, null, 2)` → Blob → download as `{collection}-run-{yyyymmdd-hhmmss}.json`

---

### Task 8.4 — Wire into `CollectionItem` kebab menu

- [ ] In `CollectionItem.tsx` kebab: add "Run Collection" menu item
- [ ] On click: open `CollectionRunModal` for that collection

---

### Task 8.5 — Manual test

- [ ] Create collection with 5 requests (some valid, some invalid URLs)
- [ ] Kebab → Run Collection → modal opens; requests fire sequentially; timeline updates live
- [ ] Click Stop mid-run → remaining requests show as Skipped
- [ ] Export report → valid JSON downloaded with correct summary counts
- [ ] Run with no environment → env vars shown unresolved in timeline URL

---

## Epic 9 — Annotated Collections + Docs Export

**Estimated time:** 5–6 hours
**Complexity:** Medium
**New files:** `components/request/DocsTab.tsx`, `lib/docsExporter.ts`
**Modified files:** `store/collectionsStore.ts`, `lib/idb.ts`, `components/collections/CollectionItem.tsx`, `components/request/RequestTabs.tsx`, `types/collection.ts`

---

### Task 9.1 — Extend data models

- [ ] In `types/collection.ts`: add `description: string` to `RequestModel` and `CollectionModel`
- [ ] In `store/collectionsStore.ts`: default `description` to `''` in all create actions
- [ ] In `lib/idb.ts`: increment DB version; migration adds `description: ''` to existing records

---

### Task 9.2 — Build `DocsTab` component (`components/request/DocsTab.tsx`)

- [ ] New tab in `RequestTabs` labelled "Docs" (added after "Pre-Request Script" tab)
- [ ] Two-pane layout (50/50 split):
  - Left: CodeMirror 6 markdown editor (`@codemirror/lang-markdown` extension)
  - Right: rendered markdown preview (use `marked`; strip `<script>` tags from output)
- [ ] Auto-save on change: 500ms debounce → `collectionsStore.updateRequest({ description })`
- [ ] Empty state in preview pane: muted text "Add documentation for this request…"
- [ ] Tab badge: small dot indicator if description is non-empty

---

### Task 9.3 — Collection description field

- [ ] In collection rename/settings modal: add `<textarea>` for collection-level description
- [ ] Toggle "Preview" button to switch between edit and rendered markdown view
- [ ] Save on modal confirm: `collectionsStore.updateCollection({ description })`

---

### Task 9.4 — Docs exporter (`lib/docsExporter.ts`)

- [ ] Implement `buildDocsHtml(collection: CollectionModel, requests: RequestModel[]): string`
  - Returns fully self-contained HTML string
  - All CSS inlined in `<style>` tag (dark background `#0F1117`, clean typography)
  - Structure per request: method badge, URL, rendered description, collapsible headers table, collapsible body block
  - Use `marked.parse(description)` to render markdown
  - No response data, no env variable values, no secrets included
  - No external fonts, stylesheets, or scripts referenced
- [ ] Implement `downloadDocsHtml(collection, requests): void`
  - Call `buildDocsHtml` → create Blob(`text/html`) → `URL.createObjectURL` → programmatic `<a download>` click

---

### Task 9.5 — "Export Docs" in collection kebab menu

- [ ] In `CollectionItem.tsx` kebab: add "Export Docs" menu item
- [ ] On click: call `downloadDocsHtml(collection, requestsInCollection)`

---

### Task 9.6 — Manual test

- [ ] Open request → Docs tab → type markdown with headers and code blocks → preview renders correctly
- [ ] Save request; reload app → description persists in Docs tab
- [ ] Add collection description → save → reopen collection modal → description shown
- [ ] Export Docs → HTML downloaded
- [ ] Open HTML in browser with no internet → fully renders (no external dependencies)
- [ ] Requests with no description → shown in HTML without empty description block

---

## Epic 10 — Request Dependencies / Chaining UI

**Estimated time:** 10–12 hours
**Complexity:** High
**New files:** `app/chain/[collectionId]/page.tsx`, `components/chain/ChainCanvas.tsx`, `components/chain/ChainNode.tsx`, `components/chain/ArrowConfigPanel.tsx`, `lib/chainRunner.ts`, `store/chainStore.ts`
**Modified files:** `lib/idb.ts`, `components/collections/CollectionItem.tsx`, `types/chain.ts` (new)

---

### Task 10.1 — Define chain types (`types/chain.ts`)

- [x] Define:
  ```ts
  type ChainEdge = {
    id: string
    sourceRequestId: string
    targetRequestId: string
    sourceJsonPath: string       // e.g. "$.data.token"
    targetField: 'url' | 'header' | 'body'
    targetKey: string            // header name, URL param name, or body JSONPath
  }
  type ChainConfig = {
    collectionId: string
    edges: ChainEdge[]
    nodePositions: Record<requestId, { x: number; y: number }>
  }
  type ChainNodeState = 'idle' | 'running' | 'passed' | 'failed' | 'skipped'
  type ChainRunState = Record<requestId, {
    state: ChainNodeState
    extractedValues: Record<edgeId, string | null>
    response?: ResponseData
  }>
  ```

---

### Task 10.2 — Extend IndexedDB and `chainStore`

- [x] In `lib/idb.ts`: add `chainConfigs` object store (keyPath: `collectionId`); increment DB version
- [x] Create `store/chainStore.ts`:
  - State: `configs: Record<collectionId, ChainConfig>`
  - Actions: `loadConfig(collectionId)`, `upsertEdge(collectionId, edge)`, `deleteEdge(collectionId, edgeId)`, `updateNodePosition(collectionId, requestId, pos)`, `clearEdges(collectionId)`
  - Persisted to `chainConfigs` IndexedDB store

---

### Task 10.3 — Chain canvas page (`app/chain/[collectionId]/page.tsx`)

- [x] `"use client"` page at `/chain/[collectionId]`
- [x] Load collection requests from `collectionsStore`
- [x] Load chain config from `chainStore.loadConfig(collectionId)`
- [x] Render `<ChainCanvas collectionId={collectionId} requests={requests} config={config} />`
- [x] Header bar: "← {collectionName}" back link + "Run Chain" button + title

---

### Task 10.4 — Build `ChainCanvas` (`components/chain/ChainCanvas.tsx`)

- [x] Use `@xyflow/react` `ReactFlow` component
- [x] Initialize nodes from `requests` array; positions from `config.nodePositions` (default: auto-layout left-to-right)
- [x] Initialize edges from `config.edges`; render as React Flow edges with label showing `edge.sourceJsonPath`
- [x] On node drag end: call `chainStore.updateNodePosition`
- [x] On connect (new edge drawn): validate no circular dependency; open `ArrowConfigPanel` for the new edge
- [x] On edge click: open `ArrowConfigPanel` for that edge (to edit config)
- [x] On edge delete (backspace/delete key): call `chainStore.deleteEdge`
- [x] During run (`ChainRunState` prop):
  - Node border colour: idle=default, running=blue pulse (CSS), passed=emerald, failed=red, skipped=grey
  - Edge label: show extracted value once source completes; "✗" in red if extraction failed
- [x] MiniMap enabled; Controls (zoom in/out/fit) enabled

---

### Task 10.5 — Build `ChainNode` (`components/chain/ChainNode.tsx`)

- [x] React Flow custom node type
- [x] Display: method badge + request name + URL (truncated to 30 chars)
- [x] State indicator icon: idle (–), running (spinner), passed (✓), failed (✗), skipped (○)
- [x] Source handle: right side (outgoing connections)
- [x] Target handle: left side (incoming connections)
- [x] Border colour driven by `ChainNodeState` via prop

---

### Task 10.6 — Build `ArrowConfigPanel` (`components/chain/ArrowConfigPanel.tsx`)

- [x] shadcn Sheet opened from the right
- [x] Shows: source request name → target request name in header
- [x] Fields:
  - "Extract from source response" — text input for JSONPath (e.g. `$.token`)
  - "Inject into target" — radio group: `URL param | Header | Body path`
  - If URL param: text input for param name
  - If Header: text input for header name
  - If Body path: text input for JSONPath target
- [x] "Save" button: calls `chainStore.upsertEdge`; closes panel
- [x] "Delete Edge" button (destructive, red): calls `chainStore.deleteEdge`; closes panel
- [x] Validation: JSONPath input must be non-empty; target key must be non-empty

---

### Task 10.7 — Chain runner (`lib/chainRunner.ts`)

- [x] Implement `buildExecutionOrder(requests, edges): string[]`
  - Topological sort (Kahn's algorithm) on request IDs using edges as directed graph
  - Returns ordered array of request IDs — run sequentially in v1
  - Detects circular dependencies; throws `CircularDependencyError`
- [x] Implement `runChain(requests, edges, onUpdate, signal): Promise<void>`
  - Get execution order via `buildExecutionOrder`
  - For each requestId in order:
    - Check `signal.aborted` → mark remaining skipped
    - Check all incoming edges: if any source failed → mark as skipped ("Dependency failed")
    - Call `onUpdate(requestId, 'running', {})`
    - Build injections: for each incoming edge, get source response, run `JSONPath` extraction
      - If extraction fails: record `null`; mark as skipped
    - Apply injections to request (mutate URL param / header / body field)
    - Fire request via `runRequest`
    - Call `onUpdate(requestId, passed ? 'passed' : 'failed', { response, extractedValues })`

---

### Task 10.8 — Wire "Chain View" into collection kebab

- [x] In `CollectionTree.tsx` kebab menu: add "Chain View" item
- [x] On click: `router.push('/chain/' + collectionId)`

---

### Task 10.9 — Manual test

- [ ] Create collection: Login, Get Profile, Get Orders (3 requests)
- [ ] Open Chain View → 3 nodes on canvas
- [ ] Draw arrow Login → Get Profile; configure: extract `$.token`; inject Header `Authorization: Bearer {value}`
- [ ] Draw arrow Get Profile → Get Orders; configure: extract `$.user.id`; inject URL param `userId`
- [ ] Click "Run Chain" → Login fires → token shown on arrow → Get Profile fires → userId shown → Get Orders fires
- [ ] All 3 pass → nodes turn green
- [ ] Break Login response (return invalid JSON) → extraction fails → Get Profile shows "Dependency failed" in red
- [ ] Reload app → edges and node positions persist correctly
- [ ] Drag a node → position saved; persists on reload

---

## Summary

| Epic | Feature | Tasks | Est. Hours |
|---|---|---|---|
| 0 | Dependencies | 1 | 0.5h |
| 1 | Code Generation Panel | 5 | 4–5h |
| 2 | Diff Two Environments | 4 | 4–5h |
| 3 | "Why Did This Fail?" Explainer | 5 | 3–4h |
| 4 | HAR Replay | 5 | 6–7h |
| 5 | Request Timing Waterfall | 5 | 3–4h |
| 6 | Offline Cached Responses | 6 | 5–6h |
| 7 | Changelog Detection | 6 | 4–5h |
| 8 | Collection Run + Timeline | 5 | 4–5h |
| 9 | Annotated Collections + Docs Export | 6 | 5–6h |
| 10 | Request Dependencies / Chaining UI | 9 | 10–12h |
| | **Total** | **57 tasks** | **~50–60h** |

---

## Recommended Build Order

```
Phase 1 — Week 1 (standalone, zero new infrastructure)
  Epic 1  Code Generation Panel       4–5h
  Epic 3  Error Explainer             3–4h
  Epic 5  Timing Waterfall            3–4h

Phase 2 — Week 2 (builds RunTimeline reused by Epic 8)
  Epic 4  HAR Replay                  6–7h
  Epic 8  Collection Run + Timeline   4–5h

Phase 3 — Week 3
  Epic 2  Diff Two Environments       4–5h
  Epic 7  Changelog Detection         4–5h

Phase 4 — Week 4 (Service Worker + persistence)
  Epic 6  Offline Cached Responses    5–6h
  Epic 9  Annotated Collections       5–6h

Phase 5 — Week 5 (highest complexity)
  Epic 10 Request Chaining UI         10–12h
```
