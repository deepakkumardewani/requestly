# Implementation Plan — Requestly Differentiating Features

**Version:** 1.0
**Date:** 2026-03-17
**Features:** Shareable Request Links · Request Health Monitor · Response Transformation Playground · Request Snapshots & Visual Diff

---

## 0. Setup — New Dependencies

Install before writing any feature code.

### 0.1 npm install

```bash
npm install jsonpath-plus zod
```

| Package | Version | Why |
|---|---|---|
| `jsonpath-plus` | latest | JSONPath evaluation in Transform Playground |
| `zod` | latest | Share link payload validation on decode (and general schema safety) |

### 0.2 Verify existing dependencies are present

These should already be in your project from the base PRD. Confirm before starting:

```bash
# Check these exist in package.json
# - idb (IndexedDB wrapper)
# - zustand
# - @codemirror/lang-javascript (needed for Playground JS mode)
# - @codemirror/state, @codemirror/view (CodeMirror 6 core)
```

If any CodeMirror language packages are missing:
```bash
npm install @codemirror/lang-javascript @codemirror/lang-json
```

### 0.3 No new backend dependencies

Zero new route handlers. No changes to `package.json` on the server side.

---

## Phase 1 — Shareable Request Links

**Estimated time:** 3–4 hours
**Complexity:** Low — pure client-side, no new stores, no IndexedDB

---

### Task 1.1 — Create share link utility (`lib/shareLink.ts`)

- [ ] Create `src/lib/shareLink.ts`
- [ ] Define `ShareRequestSchema` using Zod:
  ```ts
  const ShareRequestSchema = z.object({
    method: z.enum(['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS']),
    url: z.string(),
    headers: z.array(z.object({ key: z.string(), value: z.string(), enabled: z.boolean() })),
    params: z.array(z.object({ key: z.string(), value: z.string(), enabled: z.boolean() })),
    body: z.object({ type: z.string(), content: z.string() }),
    auth: z.object({ type: z.string(), value: z.string().optional() }).optional(),
  })
  ```
- [ ] Implement `encodeShareLink(request: SharePayload): string`
  - `JSON.stringify` → `encodeURIComponent` → `btoa`
  - Return full URL: `${window.location.origin}/?r=${encoded}`
  - Return `null` if encoded string exceeds 8KB
- [ ] Implement `decodeShareLink(raw: string): SharePayload | null`
  - `atob` → `decodeURIComponent` → `JSON.parse` → Zod parse
  - Return `null` on any failure (malformed, schema mismatch)
- [ ] Write unit tests for encode/decode round-trip (`lib/shareLink.test.ts`)

---

### Task 1.2 — Detect `?r=` param on app mount (`app/page.tsx` or root layout)

- [ ] In the main app component (`app/page.tsx`), add a `useEffect` that runs once on mount
- [ ] Call `new URLSearchParams(window.location.search).get('r')`
- [ ] If present: call `decodeShareLink(raw)`
  - On success: dispatch `openNewTabWithRequest(parsed)` to `useTabsStore`
  - On failure: show toast "Invalid share link"
- [ ] Strip `?r=` from URL: `history.replaceState({}, '', window.location.pathname)`

---

### Task 1.3 — Build `ShareButton` component (`components/request/ShareButton.tsx`)

- [ ] Create `ShareButton.tsx` — icon button using share/link icon from lucide-react
- [ ] Disabled state: when no URL is entered in the request editor
- [ ] On click: open `ShareModal`

---

### Task 1.4 — Build `ShareModal` component (`components/request/ShareModal.tsx`)

- [ ] Create `ShareModal.tsx` using shadcn/ui Dialog
- [ ] On open: call `encodeShareLink` with current request state from `useTabsStore`
- [ ] If encoded successfully:
  - Show full share URL in a read-only input
  - "Copy Link" button: copies to clipboard; button label changes to "Copied ✓" for 2s
- [ ] If payload too large (> 8KB):
  - Show warning banner: "Request too large to share as a link — export as a collection instead"
  - Copy button disabled
- [ ] ⚠ Warning section (always visible):
  - "Headers and body are included in this link. Remove any API keys or secrets before sharing."
- [ ] Expandable "What's included" detail section listing: method, URL, headers count, params count, body type
- [ ] Close button / click-outside to dismiss

---

### Task 1.5 — Wire `ShareButton` into `UrlBar`

- [ ] Import and render `<ShareButton />` in `UrlBar.tsx`, right of the Save button
- [ ] Pass current request state down or read from store directly

---

### Task 1.6 — Manual test

- [ ] Open app, build a GET request with headers
- [ ] Click Share → modal opens with URL
- [ ] Copy URL, open in new tab → request pre-populates correctly
- [ ] Test with large body (> 8KB) → warning shown, Copy disabled
- [ ] Test with corrupted `?r=` param → toast error, blank tab opened

---

## Phase 2 — Request Health Monitor

**Estimated time:** 4–5 hours
**Complexity:** Low-medium — pure aggregation of existing history, no new data collection

---

### Task 2.1 — Create URL normalisation utility (`lib/healthMonitor.ts`)

- [ ] Create `src/lib/healthMonitor.ts`
- [ ] Implement `normaliseUrl(url: string): string`
  - Parse URL with `new URL(url)`
  - Split `pathname` by `/`
  - Replace segments matching UUID regex or pure numeric with `{id}`
  - Return `${protocol}//${host}${normPath}` (no query params)
- [ ] Implement `healthKey(method: string, url: string): string`
  - Returns `${method.toUpperCase()}:${normaliseUrl(url)}`
- [ ] Implement `computeHealthMetrics(entries: HistoryEntry[]): HealthMetrics`
  - Input: array of up to 50 history entries
  - Compute: successRate (2xx count / total × 100), p50, p95, lastStatus, entryCount
  - p50/p95: sort response times, pick index at 50th/95th percentile
  - Return `{ successRate, p50, p95, lastStatus, entryCount }`
- [ ] Write unit tests (`lib/healthMonitor.test.ts`)

---

### Task 2.2 — Add health selector to `historyStore`

- [ ] In `store/historyStore.ts`, add selector:
  ```ts
  getMetricsForKey: (key: string) => HealthMetrics | null
  ```
- [ ] Implementation: filter `history` by `healthKey(entry.method, entry.url)`, take last 50, pass to `computeHealthMetrics`
- [ ] If `entryCount < 5`: return `null` (insufficient data — no dot shown)
- [ ] Memoize using `useMemo` inside `RequestItem` (selector runs per-render; must be fast)

---

### Task 2.3 — Build `SparklineChart` component (`components/common/SparklineChart.tsx`)

- [ ] Create `SparklineChart.tsx` — pure SVG, no library
- [ ] Props: `values: number[]`, `width: number`, `height: number`, `color: string`
- [ ] Scale values to fit SVG viewBox
- [ ] Render as `<polyline>` connecting the data points
- [ ] No axes, no labels — sparkline only
- [ ] Handle edge cases: single value (flat line), all-zero values

---

### Task 2.4 — Build `HealthPopover` component (`components/collections/HealthPopover.tsx`)

- [ ] Create `HealthPopover.tsx` using shadcn/ui Popover
- [ ] Props: `metrics: HealthMetrics`, `recentTimes: number[]` (last 20 response times), `onViewHistory: () => void`
- [ ] Content:
  - `SparklineChart` with last 20 response times (width: 200px, height: 40px)
  - Status distribution bar: three coloured segments proportional to 2xx/4xx/5xx counts; labels below
  - Metric row: "p50 {x}ms · p95 {y}ms · {n} requests"
  - "View in History →" link; calls `onViewHistory`

---

### Task 2.5 — Build `HealthDot` component (`components/collections/HealthDot.tsx`)

- [ ] Create `HealthDot.tsx`
- [ ] Props: `requestId: string`, `method: string`, `url: string`
- [ ] Reads metrics via `historyStore` selector
- [ ] If metrics null (< 5 entries): render nothing (return `null`)
- [ ] Dot colour logic:
  - `successRate >= 95` → green (`text-emerald-400`)
  - `successRate >= 80` → amber (`text-amber-400`)
  - `successRate < 80` → red (`text-red-400`)
- [ ] Inline layout: dot circle + `{successRate}%` + `{p50}ms` in 10px muted text
- [ ] Hover: show `Tooltip` with full metrics string
- [ ] Click: toggle `HealthPopover`

---

### Task 2.6 — Wire `HealthDot` into `RequestItem`

- [ ] In `components/collections/RequestItem.tsx`:
  - Import `<HealthDot />`
  - Render right-aligned in the request item row, after the request name
  - Pass `requestId`, `method`, `url` from the request data

---

### Task 2.7 — Add "View in History" filter action

- [ ] In `store/uiStore.ts`: add `historyFilter: string | null` and `setHistoryFilter(key: string | null): void`
- [ ] In `HistoryList.tsx`: filter displayed items when `historyFilter` is set (match by normalised URL key)
- [ ] Add a "Clear filter" chip/button when filter is active
- [ ] `onViewHistory` in `HealthPopover` calls `setHistoryFilter(healthKey)` then navigates/scrolls to history panel

---

### Task 2.8 — Add Settings toggle

- [ ] In `store/settingsStore.ts`: add `showHealthMonitor: boolean` (default: `true`)
- [ ] In `app/settings/page.tsx`: add toggle row "Show health indicators in collections"
- [ ] In `RequestItem.tsx`: gate `<HealthDot />` render on `settings.showHealthMonitor`

---

### Task 2.9 — Manual test

- [ ] Send a request 10+ times; confirm dot appears with correct colour
- [ ] Send some failing requests; confirm amber/red dot
- [ ] Hover dot → tooltip shows correct metrics
- [ ] Click dot → popover opens with sparkline and distribution bar
- [ ] "View in History" → history list filters to that endpoint
- [ ] Clear all history → dots disappear
- [ ] Toggle off in Settings → dots hidden

---

## Phase 3 — Response Transformation Playground

**Estimated time:** 5–6 hours
**Complexity:** Medium — new CodeMirror instance, jsonpath-plus lazy load, JS sandbox

---

### Task 3.1 — Add playground state to `tabsStore`

- [ ] In `store/tabsStore.ts`, extend tab state:
  ```ts
  type PlaygroundState = {
    mode: 'jsonpath' | 'js'
    code: string
    output: string | null
    error: string | null
  }
  ```
- [ ] Add `playgrounds: Record<tabId, PlaygroundState>` to store
- [ ] Add actions: `setPlaygroundMode`, `setPlaygroundCode`, `setPlaygroundOutput`, `setPlaygroundError`
- [ ] Default state per tab: `{ mode: 'jsonpath', code: '', output: null, error: null }`

---

### Task 3.2 — Create execution engine (`lib/transformRunner.ts`)

- [ ] Create `src/lib/transformRunner.ts`
- [ ] Implement `runJsonPath(code: string, responseBody: string): { output: string } | { error: string }`
  - Lazy import `jsonpath-plus`: `const { JSONPath } = await import('jsonpath-plus')`
  - Parse `responseBody` as JSON; return error if not valid JSON
  - Run `JSONPath({ path: code, json: parsed })`
  - Return stringified result or `[]` with "No matches" note
- [ ] Implement `runJs(code: string, responseObj: ResponseObject): Promise<{ output: string } | { error: string }>`
  - Wrap in `new Function('response', code)`
  - Call with `responseObj = { json, text, status, headers }`
  - Enforce 2000ms timeout: wrap in a `Promise.race` against a timeout promise
  - Catch thrown errors; return `{ error: err.message }`
  - Return `JSON.stringify(result, null, 2)` of the return value

---

### Task 3.3 — Build `TransformPlayground` component (`components/response/TransformPlayground.tsx`)

- [ ] Create `TransformPlayground.tsx`
- [ ] Props: `tabId: string`, `responseBody: string | null`, `responseStatus: number | null`, `responseHeaders: Record<string,string>`
- [ ] Outer container: collapsible (chevron toggle); collapsed by default; preference in `settingsStore`
- [ ] When `responseBody` is null or empty: show "Send a request to use the Transform Playground" empty state; editor disabled
- [ ] When `responseBody` exceeds 5MB: show "Response too large (> 5MB)" message; editor disabled
- [ ] Header row: "Transform" label + mode toggle (`JSONPath | JavaScript`) + collapse chevron
- [ ] Two-pane layout (50/50):
  - Left: CodeMirror 6 editor
    - JS mode: `javascript()` language extension
    - JSONPath mode: no language extension (plain text — JSONPath has no CodeMirror package)
    - 300ms debounce on change → trigger execution
  - Right: output pane
    - Uses `PrettyViewer` component for JSON output
    - Error state: red border + error message in red text
    - "No matches" state: muted `[]` label
    - "Copy Output" button in top-right corner of pane
- [ ] On mode switch: clear output and error; reset code to empty string
- [ ] Execution: call `runJsonPath` or `runJs` from `transformRunner.ts`; update store with result

---

### Task 3.4 — Wire `TransformPlayground` into `ResponsePanel`

- [ ] In `components/response/ResponsePanel.tsx`:
  - Import `<TransformPlayground />`
  - Render below the response tabs (after `CookiesViewer` / last tab content)
  - Pass `tabId`, current `responseBody`, `responseStatus`, `responseHeaders` from `responseStore`

---

### Task 3.5 — Manual test

- [ ] Send a GET request returning JSON; open Playground
- [ ] JSONPath mode: type `$..*` → output shows all values
- [ ] JSONPath mode: type invalid path → error shown
- [ ] JS mode: type `return response.json.id` → output shows the id value
- [ ] JS mode: type `while(true){}` → timeout fires after 2s; "Execution timed out" shown
- [ ] JS mode: type `throw new Error('oops')` → error shown
- [ ] Switch modes → code and output clear
- [ ] Send non-JSON response → JSONPath mode shows "JSONPath requires a JSON response"
- [ ] Collapse playground → preference saved; stays collapsed on next request

---

## Phase 4 — Request Snapshots & Visual Diff

**Estimated time:** 6–8 hours
**Complexity:** High — new IndexedDB store, custom diff algorithm, full-screen modal

---

### Task 4.1 — Extend IndexedDB schema (`lib/idb.ts`)

- [ ] Open `src/lib/idb.ts`
- [ ] Add `snapshots` object store to the IDB schema:
  ```ts
  db.createObjectStore('snapshots', { keyPath: 'requestId' })
  ```
- [ ] Increment the DB version number
- [ ] Handle migration: existing data unaffected; new store simply added

---

### Task 4.2 — Create `snapshotStore` (`store/snapshotStore.ts`)

- [ ] Create `src/store/snapshotStore.ts`
- [ ] State: `snapshots: Record<requestId, Snapshot>`
- [ ] Actions:
  - `hydrateSnapshots()` — load all from IndexedDB on app mount
  - `pinSnapshot(requestId, body, status)` — save to state + IndexedDB
  - `updateSnapshot(requestId, body, status)` — overwrite existing
  - `deleteSnapshot(requestId)` — remove from state + IndexedDB
  - `cleanOrphanedSnapshots(validRequestIds: string[])` — delete snapshots where requestId not in validRequestIds
- [ ] Call `hydrateSnapshots()` in the root app component alongside other store hydrations
- [ ] Call `cleanOrphanedSnapshots` on app mount after collections are loaded

---

### Task 4.3 — Create diff algorithm (`lib/diffJson.ts`)

- [ ] Create `src/lib/diffJson.ts`
- [ ] Implement `DiffEntry` type: `{ path: string, type: 'added'|'removed'|'changed', oldValue?: unknown, newValue?: unknown }`
- [ ] Implement `diffJson(golden: unknown, current: unknown, path?: string): DiffEntry[]`
  - Handle primitives: if values differ → `changed`
  - Handle arrays: diff by index; extra indices in current → `added`; missing from current → `removed`
  - Handle objects: recurse on all keys present in either object
  - Handle type change (e.g. object → string) → single `changed` entry at that path
- [ ] Implement `diffText(golden: string, current: string): TextDiffLine[]`
  - Simple LCS-based line diff
  - Return array of `{ text: string, type: 'same'|'added'|'removed' }`
- [ ] Write unit tests (`lib/diffJson.test.ts`)

---

### Task 4.4 — Build `SnapshotDiffModal` component (`components/response/SnapshotDiffModal.tsx`)

- [ ] Create `SnapshotDiffModal.tsx` — full-screen dialog (portaled to body)
- [ ] Props: `golden: Snapshot`, `current: { body: string, status: number }`, `onUpdate: () => void`, `onDismiss: () => void`
- [ ] Header: "Response Changed" title + `onUpdate` ("Update Snapshot") button + `onDismiss` ("Dismiss") button + close X
- [ ] Determine display mode:
  - If both `golden.body` and `current.body` are valid JSON → JSON diff mode
  - Otherwise → text diff mode
- [ ] JSON diff mode:
  - Run `diffJson(golden.parsedJson, currentParsedJson)`
  - Two-column layout: left "Snapshot (golden)", right "Current"
  - Render both bodies as syntax-highlighted JSON trees (reuse `PrettyViewer`)
  - Highlight changed/added/removed paths using diff entries
  - Summary row: "X fields changed, Y added, Z removed"
- [ ] Text diff mode:
  - Run `diffText(golden.body, current.body)`
  - Single-column unified diff view
  - Green background for `added` lines, red for `removed`
- [ ] Status change row: if `golden.status !== current.status` → amber banner "Status changed: {golden} → {current}"

---

### Task 4.5 — Build `SnapshotButton` component (`components/response/SnapshotButton.tsx`)

- [ ] Create `SnapshotButton.tsx`
- [ ] Props: `requestId: string | null`, `currentBody: string | null`, `currentStatus: number | null`
- [ ] Reads snapshot for `requestId` from `snapshotStore`
- [ ] States:
  - No `requestId` (unsaved request) → button hidden
  - No snapshot pinned → show "Pin Snapshot" icon button (camera icon); on click → `pinSnapshot()`
  - Snapshot exists, response matches → show green checkmark + "Matches snapshot" text
  - Snapshot exists, response differs → show amber warning icon + "Response changed" text; on click → open `SnapshotDiffModal`
  - No response yet → button disabled (grayed camera icon)
- [ ] After pinning: show brief "Snapshot pinned" toast

---

### Task 4.6 — Wire `SnapshotButton` into `ResponsePanel`

- [ ] In `components/response/ResponsePanel.tsx`:
  - Import `<SnapshotButton />`
  - Render in `ResponseMetaRow` alongside status badge and timing
  - Pass current `requestId` (from active tab), `responseBody`, `responseStatus`

---

### Task 4.7 — Add snapshot indicator to `RequestItem`

- [ ] In `components/collections/RequestItem.tsx`:
  - Read `snapshotStore.snapshots[request.id]`
  - If snapshot exists: render small camera icon (amber) after the request name
  - Tooltip: "Snapshot pinned"

---

### Task 4.8 — Add "Disable auto-diff" to request kebab menu

- [ ] In `store/snapshotStore.ts`: add `disabledAutoD iff: Set<requestId>` and toggle action
- [ ] In `RequestItem.tsx` kebab menu: add "Disable auto-diff" / "Enable auto-diff" menu item
- [ ] In `SnapshotButton`: check `disabledAutoDiff` set; if present → skip diff comparison; only show pin button

---

### Task 4.9 — Add snapshot to collection export/import

- [ ] In collection export logic: include `snapshots` for all requests in the collection
- [ ] In collection import logic: restore snapshots to `snapshotStore` and IndexedDB

---

### Task 4.10 — Manual test

- [ ] Save a request; send it; pin snapshot → camera icon appears in left panel
- [ ] Send same request again with no changes → green "Matches snapshot" shown
- [ ] Modify API (or use a different URL) to get different response → amber "Response changed" shown
- [ ] Click warning → diff modal opens; changed fields highlighted correctly
- [ ] Click "Update Snapshot" → golden updated; next send shows green checkmark
- [ ] Click "Dismiss" → modal closes; snapshot unchanged; next send triggers diff again
- [ ] Delete request → refresh app → orphaned snapshot cleaned from IndexedDB
- [ ] Export collection → snapshot data included in JSON
- [ ] Import collection → snapshots restored and functional

---

## Phase 5 — Polish & Cross-Cutting

**Estimated time:** 3–4 hours

---

### Task 5.1 — Keyboard shortcuts

- [ ] In `hooks/useKeyboardShortcuts.ts`:
  - `Cmd/Ctrl + Shift + L` → open Share modal for active tab
  - `Cmd/Ctrl + Shift + S` → pin snapshot for active tab (if response present)
- [ ] Add to keyboard shortcuts reference in Settings page

---

### Task 5.2 — Settings page additions

- [ ] In `app/settings/page.tsx`, add section "Features":
  - Toggle: "Show health indicators in collections" (`showHealthMonitor`)
  - Toggle: "Auto-compare responses against snapshots" (`globalAutoDiff`)
  - Toggle: "Show Transform Playground by default" (`showPlaygroundByDefault`)
- [ ] Wire all toggles to `settingsStore`

---

### Task 5.3 — Empty states

- [ ] `TransformPlayground` — "Send a request first" state (no response)
- [ ] `HealthPopover` — should never show with < 5 entries (dot hidden), but add guard
- [ ] `SnapshotButton` on unsaved request — button hidden with tooltip "Save request to a collection to use snapshots"

---

### Task 5.4 — Performance audit

- [ ] Verify `jsonpath-plus` is NOT in the initial bundle (confirm lazy import works)
- [ ] Run Lighthouse; confirm < 5KB initial JS bundle increase vs baseline
- [ ] Profile health metrics aggregation on history with 200 entries; confirm < 20ms
- [ ] Profile diff algorithm on a 500KB JSON response; confirm < 100ms

---

### Task 5.5 — Final cross-feature test

- [ ] Share a request that has a snapshot pinned → recipient loads it → no snapshot (snapshots are not in share links, only in collection export)
- [ ] Health monitor dot updates in real time as new requests are sent (Zustand reactivity)
- [ ] Transform Playground output is never saved to history (confirm by checking history entries)
- [ ] All features work with no active environment selected

---

## Summary

| Phase | Feature | Tasks | Est. Hours |
|---|---|---|---|
| 0 | Dependencies | 3 | 0.5h |
| 1 | Shareable Request Links | 6 | 3–4h |
| 2 | Request Health Monitor | 9 | 4–5h |
| 3 | Response Transformation Playground | 5 | 5–6h |
| 4 | Request Snapshots & Visual Diff | 10 | 6–8h |
| 5 | Polish | 5 | 3–4h |
| | **Total** | **38 tasks** | **~22–28h** |
