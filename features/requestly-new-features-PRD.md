# PRD.md — Requestly: 10 New Differentiating Features

**Version:** 1.0
**Date:** 2026-03-17
**App:** Requestly — Browser-Native API Testing Tool
**Tech Stack:** Next.js 15 (App Router) · Tailwind CSS · shadcn/ui · Zustand · IndexedDB · CodeMirror 6

---

## Product Overview

Requestly is a browser-native, zero-install, zero-account API testing tool competing with Postman, Insomnia, Bruno, and Hoppscotch. This document covers 10 new differentiating features that no other browser-based API tester ships natively. All features are client-side unless explicitly stated. No new user accounts, no new databases, and no new backend infrastructure unless specified per feature.

### The 10 Features

| # | Feature | One-line description |
|---|---|---|
| 1 | Code Generation Panel | Live multi-language code snippets for every request |
| 2 | Diff Two Environments | Run same request against two envs; diff responses side-by-side |
| 3 | "Why Did This Fail?" Explainer | Plain-English 4xx/5xx diagnosis with actionable fixes |
| 4 | HAR Replay | Import Chrome/Firefox DevTools HAR; replay full request sequence |
| 5 | Request Timing Waterfall | DNS → TCP → TLS → TTFB → Download waterfall per request |
| 6 | Offline Cached Responses | Serve last known response when offline; PWA-backed |
| 7 | Changelog Detection | Auto-detect response structure changes vs. last week's history |
| 8 | Collection Run + Timeline | Run entire collection sequentially; visual pass/fail timeline |
| 9 | Annotated Collections + Docs Export | Markdown notes on requests; export collection as static HTML docs |
| 10 | Request Dependencies / Chaining UI | Visual node graph to chain requests; zero-code token passing |

---

## Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Reduce time-to-copy-code | Code generation used per session | >40% of active sessions |
| Reduce env comparison friction | Diff Two Environments used per week | >20% of users with 2+ envs |
| Reduce debug time on errors | Explainer shown and expanded on 4xx/5xx | Shown on 100% of error responses |
| Enable production debugging | HAR Replay used per week | Measurable adoption within 30 days of ship |
| Surface silent API changes | Changelog Detection notifications opened | >30% open rate |
| Enable smoke testing | Collection Run used after deploys | >25% of users with collections |
| Reduce doc fragmentation | Docs Export used per month | Measurable adoption within 60 days |
| Keep bundle lean | Initial JS bundle delta across all 10 features | <30KB gzipped on initial load |

---

## User Personas

### Persona 1 — Solo Developer / Freelancer
- **Role:** Full-stack or backend developer working alone
- **Goals:** Copy request code into app; debug errors fast; share reproducible requests
- **Frustrations:** Manual code writing from tested requests; googling HTTP error meanings; no way to smoke-test an API without writing scripts
- **Technical skill:** Intermediate–senior

### Persona 2 — Frontend Developer
- **Role:** Builds UIs consuming third-party APIs
- **Goals:** Detect when upstream APIs change; compare staging vs prod; get code snippets per framework
- **Frustrations:** Silent API changes break the UI; comparing environments requires two manual runs
- **Technical skill:** Intermediate

### Persona 3 — Backend / API Developer
- **Role:** Builds and maintains APIs; verifies releases
- **Goals:** Run full collection as a smoke test; detect regressions; document APIs alongside requests
- **Frustrations:** No lightweight smoke test runner; documentation lives separately from the tool
- **Technical skill:** Senior

### Persona 4 — Debugger / Support Engineer
- **Role:** Investigates production issues reported by users
- **Goals:** Replay the exact HTTP sequence that caused a bug; understand why a specific request failed
- **Frustrations:** Reproducing a production request requires manual reconstruction from logs
- **Technical skill:** Intermediate–senior

---

## Core Features

| Feature | Description | Priority |
|---|---|---|
| Code Generation Panel | Live-updating panel showing fetch, axios, cURL, Python requests, Go net/http snippets for current request; one-click copy per language | P0 |
| Diff Two Environments | Select two environments from dropdowns; fire both requests in parallel; render side-by-side JSON/text diff using existing diff component | P0 |
| "Why Did This Fail?" Explainer | On 4xx/5xx: collapsible panel with plain-English cause, common fixes, docs link; driven by static lookup table keyed on status code + response body patterns | P0 |
| HAR Replay | Drag-and-drop HAR import; parse into ordered request list; replay all or selected requests sequentially with timing; results shown in a run timeline | P0 |
| Request Timing Waterfall | Parse proxy response timing headers; render DNS/TCP/TLS/TTFB/Download as a horizontal waterfall chart per request in the response panel | P0 |
| Offline Cached Responses | Service Worker caches last response per request URL+method; on network failure serves cache with "Offline — showing cached response" banner | P1 |
| Changelog Detection | On app open, compare latest history entry per endpoint against the entry from 7+ days ago; surface structural diffs as notifications in a "Changes" panel | P1 |
| Collection Run + Timeline | "Run Collection" button; fires all requests sequentially; renders a vertical timeline of results with pass (2xx) / fail / skip per request; exportable as JSON report | P1 |
| Annotated Collections + Docs Export | Markdown description field on each request and collection; "Export Docs" button generates a self-contained static HTML page from the collection | P1 |
| Request Dependencies / Chaining UI | Visual canvas showing requests as nodes; draw arrows to chain them; arrow config maps a JSONPath from source response to a target field (URL/header/body) | P2 |

---

## User Stories

### Feature 1 — Code Generation Panel

**Story 1.1**
As a developer,
I want to see ready-to-paste code for my current request in my preferred language,
So that I don't have to manually write fetch/axios/requests code after testing.

**Acceptance criteria:**
- Panel is visible below the request tab editor (collapsible)
- Updates live as method, URL, headers, params, or body change
- Languages available: cURL, fetch, axios, Python requests, Go net/http
- Each language has a one-click "Copy" button
- Active language tab is remembered per session
- `{{VAR}}` placeholders in the request are rendered as-is in the generated code (not resolved)

**Story 1.2**
As a developer,
I want the generated code to reflect my active environment variables,
So that the snippet I copy actually works without manual substitution.

**Acceptance criteria:**
- Toggle "Resolve variables" in the panel header
- When on: `{{VAR}}` replaced with current env value in the snippet
- When off: `{{VAR}}` shown literally
- Secret variables shown as `<REDACTED>` even when resolve is on

---

### Feature 2 — Diff Two Environments

**Story 2.1**
As a developer,
I want to run the same request against staging and production simultaneously,
So that I can verify they return identical responses before a release.

**Acceptance criteria:**
- "Compare Envs" button in the URL bar area
- Modal opens with two environment selectors (dropdown, populated from existing envs)
- "Run Comparison" fires both requests in parallel
- Side-by-side response diff rendered using existing `SnapshotDiffModal` diff component
- Status codes, response times, and sizes shown above each column
- Diff highlights added/removed/changed fields (JSON) or lines (text)

**Story 2.2**
As a developer,
I want to see which environment responded faster,
So that I can identify performance regressions between environments.

**Acceptance criteria:**
- Response time shown per environment in the comparison header
- Slower environment time shown in amber if delta > 200ms

---

### Feature 3 — "Why Did This Fail?" Explainer

**Story 3.1**
As a developer,
I want to understand why my request returned a 401,
So that I know whether to fix my auth token, headers, or endpoint configuration.

**Acceptance criteria:**
- Collapsible "Why did this fail?" panel appears automatically on any 4xx or 5xx response
- Panel shows: plain-English cause, 2–4 bullet-point suggestions, link to MDN docs for the status code
- Content driven by static lookup keyed on status code; additional heuristics from response body (e.g. if body contains "token expired", surface that)
- Panel is dismissable; preference to auto-expand or auto-collapse saved in settings
- Never shown on 2xx/3xx responses

**Story 3.2**
As a developer,
I want the explainer to read the response body for clues,
So that I get API-specific help, not just generic HTTP advice.

**Acceptance criteria:**
- Response body scanned for common error message patterns: "expired", "invalid", "not found", "rate limit", "forbidden", "missing"
- Matched pattern appended to explanation: e.g. "The response body mentions 'rate limit' — you may be exceeding the API's rate limit"
- Pattern matching is case-insensitive substring search (no regex complexity in v1)

---

### Feature 4 — HAR Replay

**Story 4.1**
As a support/debug engineer,
I want to import a HAR file exported from Chrome DevTools and replay all the requests,
So that I can reproduce a production issue without manually reconstructing each call.

**Acceptance criteria:**
- Drag-and-drop or file picker on the `/import` page accepts `.har` files
- HAR parsed into an ordered list of requests (method, URL, headers, body, timing)
- User can select all or individual requests to replay
- "Replay Selected" fires requests sequentially in HAR order
- Results shown in a run timeline (same component as Collection Run)
- Requests from the HAR can be saved to a new collection

**Story 4.2**
As a developer,
I want HAR entries filtered to only show XHR/fetch requests,
So that I'm not replaying irrelevant static asset requests.

**Acceptance criteria:**
- HAR import filters out entries where `_resourceType` is `image`, `stylesheet`, `font`, `script`, `media`
- Keeps: `xhr`, `fetch`, `websocket`, `other`
- Filter toggle available in the import UI to show all entries if needed

---

### Feature 5 — Request Timing Waterfall

**Story 5.1**
As a developer,
I want to see a breakdown of where time was spent in my request,
So that I can tell whether latency is from DNS, TLS, server processing, or download.

**Acceptance criteria:**
- Waterfall shown as a new "Timing" tab in the response panel (alongside Pretty, Raw, Headers, Preview, Cookies)
- Segments: DNS lookup, TCP connect, TLS handshake, Time to First Byte (TTFB), Content Download
- Rendered as a horizontal stacked bar with colour-coded segments and labels
- Absolute time (ms) shown for each segment on hover
- Total time shown at the end of the bar
- If timing data unavailable for a segment: segment shown as grey "N/A"

---

### Feature 6 — Offline Cached Responses

**Story 6.1**
As a developer working without reliable internet,
I want to see the last known response when I'm offline,
So that I can continue reviewing API responses without network access.

**Acceptance criteria:**
- Service Worker installed on first app load; caches last response per `method:url` key
- When request fails due to network error: serve cached response with amber banner "Offline — showing cached response from [timestamp]"
- Cached response shown in all response tabs (Pretty, Raw, Headers) exactly as the live response would be
- User can manually clear the response cache from Settings
- Cache stored via Cache API (not IndexedDB); max 200 entries; LRU eviction

**Story 6.2**
As a developer,
I want to know when I'm viewing a cached response vs. a live one,
So that I don't mistake stale data for a real API response.

**Acceptance criteria:**
- Cached responses always show the amber "Offline — cached" banner regardless of status code
- The response meta row shows "CACHED" badge instead of the response time
- "Refresh" button in the banner retries the live request

---

### Feature 7 — Changelog Detection

**Story 7.1**
As a developer,
I want to be notified when an API endpoint's response structure changes,
So that I can proactively fix integrations before they break.

**Acceptance criteria:**
- On app open: compare the most recent history entry per endpoint against the oldest entry older than 7 days for the same endpoint
- If response JSON structure differs (new keys, removed keys, type changes): surface in a "Changes" panel in the left sidebar
- Changes panel shows: endpoint URL, what changed (added/removed/changed fields), timestamp of both entries
- Clicking a change entry opens the two history entries side-by-side in the diff modal
- Changes panel badge shows count of detected changes
- User can dismiss individual changes or clear all

**Story 7.2**
As a developer,
I want changelog detection to run silently without slowing app startup,
So that it doesn't block me from using the app.

**Acceptance criteria:**
- Detection runs in a `requestIdleCallback` after app is fully loaded
- Detection limited to endpoints with at least 5 history entries
- Maximum 50 endpoints processed per run to cap CPU usage
- Results stored in `uiStore` (in-memory); not persisted across sessions

---

### Feature 8 — Collection Run + Timeline

**Story 8.1**
As a developer,
I want to run all requests in a collection with one click and see which passed and failed,
So that I can smoke-test an API after a deployment.

**Acceptance criteria:**
- "Run Collection" button in the collection kebab menu
- Requests fired sequentially in collection order
- Pass = 2xx status code; Fail = 4xx/5xx or network error; Skip = manually excluded
- Results shown in a vertical timeline: request name, method badge, status badge, response time, pass/fail icon
- Running request highlighted with a spinner
- Total summary at the bottom: X passed / Y failed / Z skipped, total time
- "Stop" button cancels the run mid-way

**Story 8.2**
As a developer,
I want to export the collection run result as a JSON report,
So that I can attach it to a deployment ticket or share it with the team.

**Acceptance criteria:**
- "Export Report" button available after run completes
- Exports JSON: `{ collectionName, runAt, summary, results: [{ name, method, url, status, duration, pass }] }`
- Download triggered as a `.json` file

---

### Feature 9 — Annotated Collections + Docs Export

**Story 9.1**
As a developer,
I want to add markdown descriptions to my requests and collections,
So that my collection serves as living documentation alongside the actual requests.

**Acceptance criteria:**
- "Description" field (CodeMirror markdown editor) on each request's editor tab (new "Docs" tab)
- "Description" field on each collection (in collection settings modal)
- Descriptions persisted in IndexedDB alongside existing request/collection data
- Description rendered as formatted markdown in a read-only preview pane within the tab

**Story 9.2**
As a developer,
I want to export my annotated collection as a static HTML documentation page,
So that I can share API docs with teammates or clients without giving them access to my tool.

**Acceptance criteria:**
- "Export Docs" option in collection kebab menu
- Generates a single self-contained `.html` file (all CSS/JS inlined; no external dependencies)
- HTML page contains: collection name, description, list of requests with method badge, URL, description (rendered markdown), example request headers/body, no actual response data
- File downloaded to user's machine
- Generated HTML is readable and usable without any server

---

### Feature 10 — Request Dependencies / Chaining UI

**Story 10.1**
As a developer,
I want to visually chain a Login request into a Get Profile request,
So that the auth token from Login is automatically injected into Get Profile's Authorization header without writing scripts.

**Acceptance criteria:**
- "Chain View" toggle on any collection opens a visual canvas (new route `/chain/:collectionId`)
- Each request rendered as a node (method badge + name)
- User draws an arrow from source node to target node
- Arrow config panel: source JSONPath (extracts value from source response) + target field (URL / specific header / body path)
- On "Run Chain": requests fired in dependency order; extracted values injected at runtime
- Chain config saved to IndexedDB per collection

**Story 10.2**
As a developer,
I want to see the extracted value during a chain run,
So that I can debug why a downstream request is failing.

**Acceptance criteria:**
- During run: each arrow shows the extracted value as a tooltip once source has completed
- Failed extraction (JSONPath no match) shown in red on the arrow; downstream request skipped with "Dependency failed" status

---

## User Flows

### Flow 1 — Code Generation
```
User builds/sends a request
→ Code Generation Panel (below request tabs) auto-populates
→ User clicks language tab (e.g. "Python")
→ Code snippet updates
→ User clicks "Copy" → code in clipboard → pastes into their app
```

### Flow 2 — Diff Two Environments
```
User has a request open + 2 environments configured
→ Clicks "Compare Envs" button in URL bar
→ Modal opens; selects "Staging" and "Production" from dropdowns
→ Clicks "Run Comparison"
→ Both requests fire in parallel
→ Side-by-side diff rendered
→ User identifies the differing field
→ Closes modal; continues working
```

### Flow 3 — Error Explainer
```
User sends request → receives 403 response
→ "Why did this fail?" panel auto-expands below response meta row
→ Panel shows: "403 Forbidden — the server understood your request but refused it.
   Common causes: missing permissions, wrong API key scope, IP allowlist"
→ Response body scanned → contains "insufficient_scope"
→ Additional line: "The response body mentions 'scope' — your API key may not have the required permission"
→ User clicks "MDN docs for 403 →" for more detail
```

### Flow 4 — HAR Replay
```
User exports HAR from Chrome DevTools on a broken page
→ Opens Requestly → /import → drops HAR file
→ Requestly parses → shows 12 XHR/fetch requests from the HAR
→ User deselects 3 irrelevant requests
→ Clicks "Replay Selected (9)"
→ Requests fire in sequence; timeline shows results
→ Request #7 returns 500 → user opens it to investigate
→ Saves failing request to a collection for further testing
```

### Flow 5 — Changelog Detection
```
App opens after 3 days
→ Changelog detection runs in idle callback
→ Detects: /v1/customers response now has a new field "metadata.tier" (not present 7 days ago)
→ "Changes" panel in left sidebar shows badge "1"
→ User clicks → sees the change summary
→ Clicks entry → diff modal opens showing old vs new response structure
→ User dismisses the change
```

### Flow 6 — Collection Run
```
User deploys new API version
→ Opens Requestly → finds their "Smoke Test" collection
→ Kebab menu → "Run Collection"
→ 8 requests fire sequentially; timeline updates live
→ 7 pass (green), 1 fails (red) — POST /orders returns 422
→ User clicks the failing row → response body shown inline
→ Exports JSON report → attaches to deploy ticket
```

### Flow 7 — Docs Export
```
User has annotated their "Stripe Integration" collection with markdown descriptions
→ Collection kebab → "Export Docs"
→ Browser downloads stripe-integration-docs.html
→ User opens HTML → sees formatted docs page with all endpoints, descriptions, example request shapes
→ Shares file with a client
```

### Flow 8 — Request Chaining UI
```
User opens "Auth Flow" collection → clicks "Chain View"
→ Canvas shows 3 nodes: Login, Get Profile, Get Orders
→ User draws arrow: Login → Get Profile
→ Arrow config: source JSONPath = $.token; target = Header: Authorization = Bearer {value}
→ Draws arrow: Get Profile → Get Orders
→ Arrow config: source JSONPath = $.user.id; target = URL param: userId = {value}
→ Clicks "Run Chain"
→ Login fires → token extracted → injected into Get Profile → user.id extracted → injected into Get Orders
→ All 3 pass
```

---

## Non-Goals

- **No cloud sync or team collaboration** — all data remains local; no accounts in any of these features
- **No automated test assertions** — Collection Run is pass/fail by status code only; no `pm.test()` style assertions (v2+)
- **No real OAuth 2.0 flow** — Chaining UI handles token passing but not full OAuth redirects
- **No WebSocket or SSE** in Collection Run or HAR Replay
- **No AI-generated code** in Code Generation Panel — all templates are static string builders
- **No hosted documentation** — Docs Export produces a local HTML file only; no hosting/publishing
- **No GraphQL** support in any of these features
- **No mobile support** for Chain View canvas (touch drag-and-drop deferred)
- **HAR Replay** does not replay WebSocket or SSE frames — HTTP only
- **Changelog Detection** does not run on a timer/schedule — only on app open
