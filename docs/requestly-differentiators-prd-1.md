# Product Specification — Requestly Differentiating Features

**Version:** 1.1
**Date:** 2026-03-17
**App:** Requestly — API Testing Web App
**Tech Stack:** Next.js 15 (App Router) · Tailwind CSS · shadcn/ui · Zustand · IndexedDB · CodeMirror 6

---

## 1. Product Overview

Requestly is a browser-native API testing tool competing with Postman, Insomnia, Bruno, and Hoppscotch. While the core feature set (request builder, collections, environments, history) is table-stakes across all competitors, this document specifies four differentiating features that no other browser-based API tester ships natively. The four features are: Request Snapshots & Visual Diff, Shareable Request Links, Response Transformation Playground, and Request Health Monitor. Each feature is designed to be independently shippable and adds compounding value when used together. The target is solo developers and small teams who need a fast, zero-friction tool that is smarter than a plain HTTP client but less bloated than Postman.

---

## 2. Problem Definition

### Current Workflow

Developers switch between their API tester, a JSON viewer, and Slack to share a request with a teammate. When an API response changes unexpectedly, there is no in-tool alert. When they want to share a request, they copy-paste cURL into Slack. When they need to filter a 500-field JSON response down to two fields, they open a separate jq playground.

### Pain Points

- No tool alerts you when an endpoint's response structure silently changes
- Sharing a request requires exporting a collection, uploading it, and asking the other person to import it
- Filtering or transforming a large JSON response requires leaving the tool entirely
- There is no at-a-glance view of which endpoints in your collection are slow or flaky

### Why Existing Solutions Fail

- **Postman** has response diff between two history entries but no "golden snapshot" contract testing
- **No tool** generates a shareable link that pre-populates a request without requiring an account
- **No tool** has an in-app response transformation/filter playground
- **No tool** surfaces per-endpoint reliability metrics derived from local history

---

## 3. Proposed Solution

Four discrete features added to the existing Requestly interface, each independently useful and zero-account-required:

| # | Feature | One-line description |
|---|---|---|
| 1 | Request Snapshots & Visual Diff | Pin a golden response; flag future deviations automatically | - dont want to do it now
| 2 | Shareable Request Links | One URL encodes the full request; recipient opens it pre-populated |
| 3 | Response Transformation Playground | Write JS/JSONPath in-app to filter/reshape the response |
| 4 | Request Health Monitor | Per-endpoint reliability score derived from local history |

---

## 4. Target Users

### Persona 1 — Solo Developer / Freelancer

- **Role:** Full-stack or backend developer working alone or on a small team
- **Goals:** Test APIs quickly without setup friction; share requests with clients
- **Frustrations:** Postman is overkill; doesn't want to create an account just to share a request
- **Technical skill:** Intermediate–senior; comfortable with JSON, REST, basic JS

### Persona 2 — Frontend Developer

- **Role:** Builds UIs that consume third-party APIs
- **Goals:** Understand API response shape; filter to relevant fields; detect when a third-party API silently changes
- **Frustrations:** Large JSON responses are hard to read; no alerting when upstream API changes
- **Technical skill:** Intermediate; comfortable with JSONPath basics

### Persona 3 — API Developer / Backend Engineer

- **Role:** Builds and maintains APIs
- **Goals:** Quickly test their own endpoints; catch regressions; share reproducible requests with teammates for debugging
- **Frustrations:** Reproducing a bug requires sending cURL snippets over Slack
- **Technical skill:** Senior; comfortable with scripting

---

## 5. Core Features

| Feature | Description | Priority |
|---|---|---|
| Request Snapshots & Visual Diff | Pin a response as "golden"; future sends compared against it; diff highlighted | P0 |
| Shareable Request Links | Encode request state as URL-safe base64 query param; decode on open | P0 |
| Response Transformation Playground | Collapsible panel below response; JS sandbox + JSONPath; live output | P0 |
| Request Health Monitor | Aggregate history entries per URL+method; compute avg time, success rate; show in sidebar | P0 |

---

## 6. User Journeys

### Feature 1 — Request Snapshots & Visual Diff

```
User sends a request, sees the response
→ Clicks "Pin as Snapshot" button in response meta row
→ Current response body saved to IndexedDB as the "golden" snapshot for this request
→ Snapshot icon in the left panel request item turns amber (indicating active snapshot)

Next time user sends the same request:
→ Response body compared against golden snapshot automatically
→ If identical: green checkmark in meta row "Matches snapshot"
→ If different: amber warning "Response changed" + count of changed fields
→ User clicks warning → Diff view opens (side-by-side: golden left, current right)
→ Added fields: green background; removed fields: red background; changed values: amber
→ User can "Update Snapshot" to promote current response to new golden
→ Or "Dismiss" to ignore the diff this time
```

---

### Feature 2 — Shareable Request Links

```
User has a request open (method, URL, headers, body, params configured)
→ Clicks "Share" icon button in URL bar area
→ Modal opens: "Shareable Link"
→ App serialises current request state → base64 encodes → appends as ?r= query param
→ Full URL shown: https://requestly.app/?r=eyJtZXRob2QiOiJHRVQi...
→ Copy button copies to clipboard
→ Toast: "Link copied — anyone with this link gets this request pre-loaded"

Recipient opens the link:
→ App boots normally
→ On mount: detects ?r= param → decodes → hydrates request editor
→ Toast: "Request loaded from shared link"
→ Recipient can send immediately or save to their own collection
```

**Security note surfaced in UI:**
```
Modal shows: "⚠ Headers and body are included in the link.
Remove any secret keys before sharing."
```

---

### Feature 3 — Response Transformation Playground

```
User receives a large JSON response (e.g. 200-field Stripe customer object)
→ Below the response tabs, a collapsed panel: "Transform" (chevron to expand)
→ User expands it
→ Left pane: CodeMirror editor, mode selector (JS | JSONPath)
→ Right pane: live output (updates as user types, 300ms debounce)

JSONPath mode example:
  User types: $.data[*].email
  Output pane shows: ["a@b.com", "c@d.com"]

JS mode example:
  User types:
    const d = response.json;
    return d.data.map(c => ({ id: c.id, email: c.email }));
  Output pane shows the mapped array

→ "Copy Output" button copies transformed result
→ Playground state saved per-tab in Zustand (not persisted to IndexedDB)
```

---

### Feature 4 — Request Health Monitor

```
Left panel — each request item in Collections tree shows:
  GET  List Customers   ●  98%  120ms

Where:
  ● = colour-coded dot (green >95%, amber 80–95%, red <80% success rate)
  98% = success rate from last 50 history entries for this URL+method
  120ms = p50 response time from last 50 entries

User hovers the dot → tooltip:
  "Last 50 requests · 98% success · p50 120ms · p95 340ms · Last: 200 OK"

User clicks the dot → opens Health Detail popover:
  - Mini sparkline of response times over time
  - Status code distribution bar (2xx / 4xx / 5xx)
  - "View in History" link → filters history to this endpoint
```

---

## 7. Functional Requirements

### Feature 1 — Request Snapshots & Visual Diff

- Snapshots stored in IndexedDB store: `snapshots` — `{ id, requestId, body, parsedJson, status, capturedAt }`
- One snapshot per request (overwritten on "Update Snapshot")
- "Pin as Snapshot" button in response meta row; only enabled when a response is present
- Diff algorithm: deep JSON diff on parsed body; falls back to line-by-line text diff for non-JSON
- Diff view is a full-screen modal (portaled to body): two-column layout, golden on left, current on right
- Changed lines highlighted: green (added), red (removed), amber (modified value)
- Non-JSON responses: unified text diff view (no two-column layout)
- "Update Snapshot" button in diff modal header — overwrites the golden
- "Dismiss" button closes modal without clearing the snapshot
- Snapshot indicator on request item in left panel: small camera icon, amber if snapshot exists
- Auto-diff can be disabled per-request via kebab menu → "Disable auto-diff"
- Snapshots included in collection export JSON; restored on import
- Orphaned snapshots (where requestId no longer exists) cleaned up on app load

---

### Feature 2 — Shareable Request Links

**Serialisation:**
- Fields included: `method`, `url`, `headers[]`, `params[]`, `body {type, content}`, `auth {type, value}`
- Fields excluded: resolved environment variable values (never included — security)
- Serialisation: `JSON.stringify` → `btoa` (URL-safe base64) → `?r=` query param
- Max encoded size: 8KB enforced; show warning and disable Copy if exceeded

**Deserialisation:**
- On app mount: check `window.location.search` for `?r=`
- If present: decode → validate shape with Zod → hydrate a new unsaved tab
- Strip `?r=` from URL after hydration via `history.replaceState`
- If decode/validation fails: toast "Invalid share link"; open blank tab

**UI:**
- Share icon button in the URL bar row (right of Save)
- Modal: full share URL, Copy button, ⚠ secrets warning
- Expandable "What's included" section listing included fields
- No server call; entirely client-side

---

### Feature 3 — Response Transformation Playground

- Panel is a collapsible section below the response tabs
- Default state: collapsed; toggle preference saved in `settingsStore`
- Mode toggle: "JSONPath" | "JavaScript" — default JSONPath
- Editor: CodeMirror 6; JS mode reuses existing JS language support in the app
- JSONPath execution: `jsonpath-plus` library, lazy-loaded on first use
- JavaScript execution: `new Function('response', code)(responseObj)` sandbox; `response` = `{ json, text, status, headers }`; 2000ms timeout via `setTimeout` + abort flag
- Output pane: reuses existing `PrettyViewer` component for syntax-highlighted output
- Error state: red border on editor; error message rendered in output pane
- "Copy Output" button copies stringified output to clipboard
- Playground does not mutate the stored response in history or Zustand
- Playground state (code, mode) persisted per-tab inside `useTabsStore`
- Disabled with explanatory message when response body > 5MB

---

### Feature 4 — Request Health Monitor

**Data source:** existing `historyStore` — zero new data collection; only aggregation

**URL normalisation key:** `${method}:${normalisedUrl}`
- Strip all query params from URL before keying
- Replace path segments matching UUID pattern (`[0-9a-f-]{36}`) or pure numeric (`^\d+$`) with `{id}`
- Example: `GET:https://api.stripe.com/v1/customers/{id}/invoices`

**Aggregation (computed on demand, memoised via Zustand selector):**
- Window: last 50 history entries matching the normalised key
- Metrics: success rate (2xx / total), p50 response time, p95 response time, last status code, entry count

**UI — inline in Collections tree (RequestItem):**
- Only shown on saved collection requests, not history list items
- Layout: `[method badge] [request name] ... [dot] [success%] [p50ms]`
- Dot colours: green (≥95%), amber (80–94%), red (<80%), grey (< 5 entries)
- Typography: 10px muted text; does not compete with request name
- Hideable via Settings toggle `showHealthMonitor`

**UI — hover tooltip (existing Tooltip component):**
- Content: `"Last {n} requests · {rate}% success · p50 {x}ms · p95 {y}ms · Last: {status}"`

**UI — Health Detail popover (click dot):**
- SVG sparkline: last 20 response times as a line chart (hand-rolled, no library)
- Status distribution bar: proportional green/amber/red segments for 2xx/4xx/5xx
- "View in History" text link: sets a filter on the history list to this normalised URL

---

## 8. System Architecture

### Frontend

- **Framework:** Next.js 15 App Router — all UI as Client Components, unchanged
- **New components:**
  - `SnapshotButton` — pin button in response meta row
  - `SnapshotDiffModal` — full-screen two-column diff modal
  - `ShareButton` + `ShareModal` — share link UI in URL bar
  - `TransformPlayground` — collapsible panel with CodeMirror + output pane
  - `HealthDot` — inline dot + stats in RequestItem
  - `HealthPopover` — click-to-open detail popover with sparkline
  - `SparklineChart` — hand-rolled SVG line chart (~40 lines)

### New Zustand Stores

| Store | Purpose |
|---|---|
| `snapshotStore` | Holds `snapshots: Record<requestId, Snapshot>`; hydrated from IndexedDB on mount |
| `transformStore` | Holds `playgrounds: Record<tabId, PlaygroundState>`; lives inside `useTabsStore` |

`validationStore`, `aiStore`, and `linkedSpecs` from v1.0 are removed — not needed.

### New IndexedDB Store

| Store | Key | Value |
|---|---|---|
| `snapshots` | `requestId` | `{ id, requestId, body, parsedJson, status, capturedAt }` |

### New Backend Routes

None. All four features are entirely client-side. No new route handlers required.

### New Libraries

| Library | Feature | Load strategy | Approx. gzipped |
|---|---|---|---|
| `jsonpath-plus` | Transform Playground — JSONPath mode | Lazy (on first Playground open) | ~8KB |

No other new libraries. Sparkline is hand-rolled SVG. Diff algorithm is custom (see §10). Share link is native `btoa`/`atob`.

---

## 9. Data Models

### Snapshot

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary key |
| `requestId` | `string` | FK → request in collectionsStore |
| `body` | `string` | Raw response body text |
| `parsedJson` | `object \| null` | Pre-parsed JSON; null if body is not valid JSON |
| `status` | `number` | HTTP status code at time of capture |
| `capturedAt` | `number` | Unix timestamp (ms) |

### PlaygroundState (in-memory per tab, inside tabsStore)

| Field | Type | Description |
|---|---|---|
| `mode` | `'jsonpath' \| 'js'` | Active execution mode |
| `code` | `string` | Current editor content |
| `output` | `string \| null` | Last successful output (stringified JSON) |
| `error` | `string \| null` | Last execution error message |

### HealthMetrics (computed, never stored)

| Field | Type | Description |
|---|---|---|
| `successRate` | `number` | 0–100; percentage of 2xx responses |
| `p50` | `number` | Median response time in ms |
| `p95` | `number` | 95th percentile response time in ms |
| `lastStatus` | `number` | Most recent HTTP status code |
| `entryCount` | `number` | Number of history entries in the window |

---

## 10. Implementation Notes

### Snapshot Diff Algorithm

No library needed. Custom recursive JSON diff:

```ts
type DiffEntry = {
  path: string        // e.g. "data[0].email"
  type: 'added' | 'removed' | 'changed'
  oldValue?: unknown
  newValue?: unknown
}

function diffJson(golden: unknown, current: unknown, path = ''): DiffEntry[]
```

Walk both objects recursively. At each key:
- Key in golden but not current → `removed`
- Key in current but not golden → `added`
- Both present, primitives differ → `changed`
- Both present, both objects → recurse

For non-JSON: split both bodies by `\n`, compute LCS (longest common subsequence) — standard line diff, ~50 lines of TS.

### Share Link Serialisation

```ts
// encode
const payload = JSON.stringify({ method, url, headers, params, body, auth })
const encoded = btoa(unescape(encodeURIComponent(payload)))  // handles Unicode
const shareUrl = `${window.location.origin}/?r=${encoded}`

// decode (on mount)
const raw = new URLSearchParams(window.location.search).get('r')
if (raw) {
  const decoded = decodeURIComponent(escape(atob(raw)))
  const parsed = ShareRequestSchema.parse(JSON.parse(decoded))  // Zod validation
  openNewTabWithRequest(parsed)
  history.replaceState({}, '', window.location.pathname)
}
```

### Health Monitor Normalisation

```ts
function normaliseUrl(url: string): string {
  const u = new URL(url)
  const normPath = u.pathname
    .split('/')
    .map(seg =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg) ? '{id}'
      : /^\d+$/.test(seg) ? '{id}'
      : seg
    )
    .join('/')
  return `${u.protocol}//${u.host}${normPath}`
}

function healthKey(method: string, url: string): string {
  return `${method.toUpperCase()}:${normaliseUrl(url)}`
}
```

---

## 11. Frontend Component Map

```
RightPanel
├── UrlBar
│   └── ShareButton              ← new (icon button, right of Save)
├── ShareModal                   ← new (portaled)
├── RequestTabs (existing)
└── ResponsePanel
    ├── ResponseMetaRow
    │   └── SnapshotButton       ← new (icon button in meta row)
    ├── ResponseTabs (existing)
    └── TransformPlayground      ← new (collapsible section below tabs)

LeftPanel
└── CollectionTree
    └── RequestItem
        └── HealthDot            ← new (inline, right-aligned)
            └── HealthPopover    ← new (on click)
                └── SparklineChart ← new (SVG)

SnapshotDiffModal                ← new (portaled, full-screen)
```

---

## 12. Non-Functional Requirements

### Performance

| Requirement | Target |
|---|---|
| Snapshot diff render | < 100ms for responses up to 500KB |
| Share link encode/decode | < 10ms |
| Transform — JSONPath execution | < 50ms |
| Transform — JS execution | < 2000ms (hard timeout) |
| Health metrics aggregation | < 20ms for 50 history entries |

### Security

- Share links include a prominent ⚠ warning about headers/body being visible in the URL
- `Authorization` header value shown as `[hidden]` by default in the share URL preview; user must opt-in to include it
- JS sandbox uses `new Function()` — no `eval`; the injected `response` object has no reference to DOM or `fetch`
- No new server-side attack surface — zero new route handlers

### Bundle Size Impact

| Addition | Approx. gzipped |
|---|---|
| `jsonpath-plus` (lazy) | ~8KB |
| New components + utils | ~10KB |
| **Total addition to initial bundle** | **< 5KB** (jsonpath-plus deferred) |

### Reliability

- Snapshot diff failure on corrupt IndexedDB entry → toast error; auto-diff disabled for that request session
- Share link decode failure → toast "Invalid share link"; blank tab opened; no crash
- Transform JS timeout → execution aborted; error shown in output pane; editor remains editable
- Health monitor with corrupt history entries → bad entries skipped; aggregation continues with remaining entries

---

## 13. Edge Cases

### Snapshots
- Response body is non-JSON (HTML, plain text, XML) → text diff used; two-column layout replaced with unified diff
- Response body is binary (image, PDF) → snapshot disabled; "Pin as Snapshot" button hidden; tooltip: "Binary responses cannot be snapshotted"
- Request deleted after snapshot captured → orphaned snapshot detected on app load; cleaned from IndexedDB silently
- User updates snapshot while diff modal is open → modal refreshes to show new golden vs current

### Share Links
- Encoded payload exceeds 8KB → Share modal shows warning banner; Copy button disabled; suggests collection export
- URL contains `{{VAR}}` placeholders (unresolved) → included as-is; recipient sees the same placeholders
- Recipient has a different active environment → their environment is used; `{{VAR}}` resolved with their own values

### Transform Playground
- JS code throws synchronously → caught in try/catch; error in output pane; no crash
- JS code runs an infinite loop → 2000ms timeout fires; "Execution timed out" in output pane
- JSONPath expression returns no matches → output pane shows `[]` with muted "No matches found" label
- Response body > 5MB → playground shows "Response too large (> 5MB) — download and transform locally"
- Response is not JSON and mode is JSONPath → output pane shows "JSONPath requires a JSON response"

### Health Monitor
- Request never sent (0 entries in window) → no dot rendered; space not reserved (no layout shift)
- All history cleared → dots disappear immediately (Zustand selector recomputes reactively)
- Highly dynamic URLs (e.g. contain Unix timestamps) → normalisation replaces numeric segments with `{id}`; if > 500 unique keys computed across all history, aggregation paused for performance and warning shown in Settings

---

## 14. Analytics

All events local-only — no external analytics in v1.

| Event | Trigger | Properties |
|---|---|---|
| `snapshot_pinned` | User pins a snapshot | `request_method` |
| `snapshot_diff_viewed` | Diff modal opened | `changed_fields_count`, `is_json` |
| `snapshot_updated` | User clicks "Update Snapshot" | — |
| `share_link_copied` | User copies share link | `method`, `has_headers`, `has_body` |
| `share_link_loaded` | App decodes `?r=` on mount | — |
| `transform_executed` | User runs transformation | `mode: 'jsonpath' \| 'js'`, `success: boolean` |
| `health_popover_opened` | User clicks health dot | `bucket: 'green' \| 'amber' \| 'red'` |

---

## 15. Development Roadmap

### Phase 1 — Lowest complexity, highest standalone value (Week 1)
- Shareable Request Links — pure client-side, no new stores, no IndexedDB
- Request Health Monitor — pure aggregation of existing history, no new data

### Phase 2 — Medium complexity (Week 2)
- Response Transformation Playground — new CodeMirror instance + jsonpath-plus + JS sandbox

### Phase 3 — Most complex (Week 3)
- Request Snapshots & Visual Diff — new IndexedDB store + diff algorithm + full-screen modal

### Phase 4 — Polish (Week 4)
- Keyboard shortcuts: `Cmd+Shift+S` pin snapshot, `Cmd+Shift+L` copy share link
- Empty states and skeletons for all new panels
- Settings toggles: hide health monitor, disable auto-diff globally
- Snapshot export/import with collection JSON
- Performance audit: confirm < 5KB initial bundle increase

---

## 16. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Share links expose auth secrets | Medium | High | Hide `Authorization` value by default in preview; prominent warning; opt-in to include |
| Snapshot diff is slow on large responses (> 1MB JSON) | Low | Medium | Cap diff at 1MB; show "Response too large to diff — download to compare" beyond cap |
| JS sandbox infinite loop blocks UI thread | Low | Medium | 2000ms `setTimeout` abort flag; consider `Worker` for JS execution in v2 |
| Health monitor URL normalisation misgroups endpoints | Medium | Low | Normalisation is configurable; user can reset stats per-request via kebab menu |

---

## 17. Future Enhancements

- **Snapshot history:** keep last N snapshots per request (timeline), not just one golden
- **Share link expiry:** optional TTL (requires a short-URL backend micro-service)
- **Named transforms:** save a playground script as a named transform on the request; rerun on every send
- **Health monitor alerts:** browser notification when success rate drops below threshold
- **AI-Native Request Building:** describe a call in plain English → request auto-populated (deferred)
- **Live Schema Validation:** validate response against linked OpenAPI spec inline (deferred)

---

## 18. Open Questions

| # | Question | Notes |
|---|---|---|
| 1 | Should share links include resolved env variable values? | Current: no. May add opt-in toggle for trusted internal sharing. |
| 2 | Snapshot for non-JSON: text diff or skip entirely? | Current spec: text diff. Skip is simpler but less useful for XML/HTML APIs. |
| 3 | Should Transform Playground state persist across sessions (IndexedDB)? | Current: session-only (Zustand). Persisting risks stale code confusing users. |
| 4 | Health monitor window: last 50 entries or last 7 days? | Current: count-based (50). Time-based would be more intuitive for infrequent requests. |
| 5 | Should health dot be shown on history items as well as collection items? | Current: collection items only. History items are transient; dots would be noisy. |
