# Product Requirements Document

## Requestly — API Testing Web App

**Version:** 1.0  
**Date:** 2026-03-12  
**Tech Stack:** Next.js 15 (App Router) · Tailwind CSS · shadcn/ui · Zustand · IndexedDB (via idb) · Native fetch (no TanStack Query — see §7)

---

## 1. Overview

A modern, browser-native API testing tool that lets developers craft, send, and organise HTTP requests without leaving the browser. It competes in spirit with tools like Postman, Insomnia, and Bruno — but lives entirely in the browser with zero install friction, zero accounts required, and a best-in-class UX.

Built on **Next.js 15**, which solves the fundamental browser CORS limitation all web-based API testers face: all outbound API requests are routed through a Next.js Route Handler (`/app/api/proxy/route.ts`) that runs server-side on the same domain, so the browser never makes a cross-origin request directly. This is the same architecture used by HTTPie's web app, Postman's web client, and every other deployed browser-based API tester.

**App name:** Requestly  
**Brand:** Dark-first interface. The UI uses a dynamic accent colour system — the active HTTP method drives a subtle colour tint across the entire interface (see §4.9). Default accent is emerald (`#6EE7B7`) for GET. Deep-charcoal surfaces (`#0F1117`). Clean monospace accents for technical data; refined sans-serif for UI chrome.

---

## 2. Core Concepts

| Concept | Definition |
|---|---|
| **Request** | A single HTTP call (method + URL + headers + body + params + auth) |
| **Collection** | A named folder grouping related requests |
| **Environment** | A named set of key-value variable pairs (e.g. `dev`, `staging`, `prod`) |
| **History** | Auto-saved log of recent requests and their responses |
| **cURL Import** | Paste a `curl` command; the app parses and populates all fields |

---

## 3. Layout Architecture

### 3.1 Two-Column Layout (all screen sizes ≥ 768px)

```
┌──────────────────────────┬───────────────────────────────────────────────────┐
│  Left Panel (280px)      │  Right Panel (flex-fill)                          │
│                          │                                                    │
│  [App Logo + Name]       │  [Method▾] [URL input] [ENV▾] [Send]              │
│  [+ New Request]         │  ─────────────────────────────────────────────    │
│  [ENV selector]          │  Tabs: Params | Headers | Auth | Body | cURL      │
│  ─────────────────────── │  ─────────────────────────────────────────────    │
│  Collections             │  [Request editor panel]                           │
│    ▶ Collection A        │                                                    │
│      └ Request 1         │  ─────────────────────────────────────────────    │
│      └ Request 2         │  Response                                         │
│    ▶ Collection B        │  Status badge | Time | Size | Tabs                │
│  ─────────────────────── │  Pretty | Raw | Headers | Preview                 │
│  Recent                  │                                                    │
│    Request 3 (GET)       │                                                    │
│    Request 4 (POST)      │                                                    │
└──────────────────────────┴───────────────────────────────────────────────────┘
```

- Left panel is **fixed-width, scrollable** with a resize handle (drag to 200–400px)
- Right panel is **flex column**: URL bar (fixed) → tab editor (resizable) → response panel (resizable)
- Splitter between editor and response panels is draggable
- On mobile (<768px): single-column; left panel becomes a **slide-in drawer** via hamburger

### 3.2 Left Panel Sections

1. **Header bar** — App logo/name + "New Request" (`+`) button + settings icon
2. **Environment selector** — Dropdown showing active environment name, `Manage Envs` link
3. **Collections** — Accordion tree. Each collection: folder icon, name, kebab menu (rename/delete/add request). Each request item: method badge (colour-coded), name, kebab menu (rename/duplicate/delete/move)
4. **Recent Requests** — Flat list of last 20 requests. Each item: method badge, truncated URL, relative timestamp. Click to rehydrate the request editor.

---

## 4. Features

### 4.1 Request Builder (Right Panel — Top)

#### URL Bar
- **Method selector** — Dropdown: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`; each method has a distinct colour badge
- **URL input** — Full-width text input. Supports `{{variable}}` interpolation highlighted inline. Placeholder: `https://api.example.com/v1/users`
- **Environment badge** — Pill showing active env name. Click → quick-switch popover
- **Send button** — Primary CTA. Shows loading spinner while in-flight. Keyboard shortcut: `Cmd/Ctrl + Enter`
- **Save button** — Saves request to a collection. Opens "Save to Collection" modal on first save

#### Request Tabs

| Tab | Contents |
|---|---|
| **Params** | Key-value table. Auto-syncs with URL query string (bidirectional). Toggle row checkbox to include/exclude. |
| **Headers** | Key-value table with autocomplete for standard header names. Toggle rows. |
| **Auth** | Auth type selector: None / Bearer Token / Basic Auth / API Key (header or query) / OAuth 2.0 (token input only in v1) |
| **Body** | Type selector: None / raw (JSON \| XML \| Text \| HTML) / form-data / x-www-form-urlencoded. Monaco-lite editor for raw. |
| **cURL** | Textarea. Paste any `curl` command → "Import" button parses and populates all other tabs automatically. Also shows a live-generated equivalent `curl` for the current request state. |
| **Pre-Request Script** *(v1 basic)* | Simple JS textarea. `{{variable}}` can be set here. Runs before request is sent. |

#### Variable Interpolation
- Any `{{VAR_NAME}}` in URL, headers, params, or body is replaced with values from the active environment at send time
- Unknown variables are highlighted red inline; known ones in teal

---

### 4.2 Response Panel (Right Panel — Bottom)

- **Status badge** — Colour-coded: 2xx green, 3xx blue, 4xx amber, 5xx red
- **Meta row** — Status code + text · Response time (ms) · Response size (KB/MB)
- **Response Tabs:**

| Tab | Contents |
|---|---|
| **Pretty** | Syntax-highlighted, collapsible JSON/XML/HTML viewer |
| **Raw** | Plain text response body |
| **Headers** | Response headers in a clean key-value table |
| **Preview** | Rendered HTML (in sandboxed iframe) for HTML responses |
| **Cookies** | Parsed Set-Cookie headers in tabular form |

- **Copy button** — Copies raw response body to clipboard
- **Download button** — Saves response as `.json` / `.txt` / `.xml`
- **Clear button** — Clears the response panel

---

### 4.3 Collections

- Create, rename, delete collections
- Drag-and-drop reorder requests within and between collections
- Duplicate a collection
- **Export collection** — Downloads as a `.json` file (Requestly format)
- **Import collection** — Accepts Requestly JSON or **Postman Collection v2.1** JSON
- Nested folders (one level deep in v1)

---

### 4.4 Environment Variables

- Create multiple named environments (e.g. `Local`, `Staging`, `Production`)
- Each environment: key-value pairs with optional "secret" flag (value masked in UI)
- Active environment selected from the URL bar badge or left panel dropdown
- Global variables: a special "Global" env whose variables are available across all environments
- Environment editor: modal with a table editor; supports bulk edit via JSON textarea toggle
- `{{VAR_NAME}}` syntax used everywhere (URL, headers, body, params)

---

### 4.5 cURL Import & Export

**Import:**
- Accepts any valid `curl` command
- Parsed fields: method (`-X`), URL, headers (`-H`), body (`-d` / `--data`), query params (from URL), auth (`-u`)
- One-click: paste into cURL tab → "Import" → all fields populated
- Error shown inline if the pasted string is not valid cURL

**Export:**
- "Copy as cURL" button in the URL bar area (icon button)
- Generated cURL reflects current request state including active environment variable substitution

---

### 4.6 History

- Last 200 requests auto-saved to IndexedDB
- Each history entry: timestamp, method, URL, status code, response time
- Click any history item → rehydrates the request editor (does not overwrite unsaved current state without confirmation)
- Filter/search history by URL or method
- Clear history (with confirmation)

---

### 4.7 Request Chaining & Scripts (v1 Basic)

- **Pre-request script**: JS snippet that runs before the request. Can set `{{variables}}` dynamically via a simple `env.set('KEY', 'value')` API
- **Post-response script**: JS snippet that runs after response. Can assert status, parse body, and set variables for chaining (e.g. extract a token from a login response and set it as `{{AUTH_TOKEN}}`)
- Script editor: CodeMirror with JS syntax highlighting
- Console panel (collapsible) shows `console.log` output from scripts

---

### 4.8 Additional UX Features

| Feature | Detail |
|---|---|
| **Keyboard shortcuts** | `Cmd+Enter` send · `Cmd+S` save · `Cmd+N` new request · `Cmd+K` command palette |
| **Command Palette** | `Cmd+K` fuzzy-search across collections, history, and settings |
| **Dark / Light / System theme** | Toggle in settings; default dark |
| **Request tabs** | Multiple open requests as tabs across the top of the right panel (like a browser) |
| **Response diff** | Compare two responses side-by-side (from history) |
| **SSL toggle** | Option to skip SSL verification (for local dev with self-signed certs) |
| **Follow redirects toggle** | Option per request |
| **Proxy settings** | Optional CORS proxy URL prefix for browser-restricted endpoints |
| **Search** | Global search (`Cmd+F`) across collections and history |

---

### 4.9 Method-Driven UI Theming

When the user changes the HTTP method, the entire UI shifts to a matching accent colour — subtly, not aggressively. The intent is ambient context-awareness: a glance at the interface tells you what kind of request you're building, without the colour ever competing with the content.

#### Method → Colour Mapping

| Method  | Colour   | RGB              |
|---------|----------|------------------|
| GET     | Emerald  | `52, 211, 153`   |
| POST    | Blue     | `96, 165, 250`   |
| PUT     | Amber    | `251, 191, 36`   |
| PATCH   | Purple   | `192, 132, 252`  |
| DELETE  | Red      | `248, 113, 113`  |
| HEAD    | Cyan     | `34, 211, 238`   |
| OPTIONS | Pink     | `244, 114, 182`  |

#### Implementation

Since the project uses Vite + Tailwind CSS, the accent system is wired directly into Tailwind's theme via CSS custom properties — giving you the full Tailwind class API (`bg-accent/10`, `text-accent`, `border-accent/20`, etc.) while keeping the runtime switching purely in JS.

**Step 1 — `tailwind.config.js`**: register `accent` as a theme colour backed by CSS variables:

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        accent: "rgb(var(--accent-r) var(--accent-g) var(--accent-b) / <alpha-value>)",
      },
    },
  },
};
```

**Step 2 — method palette** (in `lib/constants.ts`): map each method to its RGB channel values:

```ts
export const METHOD_PALETTE: Record<string, { r: number; g: number; b: number }> = {
  GET:     { r: 52,  g: 211, b: 153 }, // emerald-400
  POST:    { r: 96,  g: 165, b: 250 }, // blue-400
  PUT:     { r: 251, g: 191, b: 36  }, // amber-400
  PATCH:   { r: 192, g: 132, b: 252 }, // purple-400
  DELETE:  { r: 248, g: 113, b: 113 }, // red-400
  HEAD:    { r: 34,  g: 211, b: 238 }, // cyan-400
  OPTIONS: { r: 244, g: 114, b: 182 }, // pink-400
};
```

**Step 3 — `useMethodTheme` hook** (in `hooks/useMethodTheme.ts`): updates the three root CSS variables whenever the active method changes:

```ts
export function useMethodTheme(method: string) {
  useEffect(() => {
    const { r, g, b } = METHOD_PALETTE[method] ?? METHOD_PALETTE.GET;
    const root = document.documentElement;
    root.style.setProperty("--accent-r", String(r));
    root.style.setProperty("--accent-g", String(g));
    root.style.setProperty("--accent-b", String(b));
  }, [method]);
}
```

Called once at the top of the main layout component: `useMethodTheme(request.method)`.

After this, every Tailwind opacity modifier just works — `bg-accent/10` is 10% opacity, `border-accent/20` is 20%, `text-accent` is full solid — all resolved at paint time by the browser.

#### Surfaces That Receive the Tint (low opacity — never loud)

| Surface | Tailwind classes used |
|---|---|
| Left panel background | `bg-gradient-to-b from-accent/[0.04] to-transparent` |
| Left panel border | `border-accent/[0.18]` |
| App logo dot | `bg-accent transition-colors duration-300` |
| "New Request" button | `bg-accent/[0.06] border-accent/[0.18] text-accent hover:bg-accent/10` |
| URL bar background | `bg-gradient-to-r from-accent/[0.04] to-transparent` |
| URL bar bottom border | `border-accent/[0.18]` |
| URL input focus ring | `focus:border-accent/[0.18] focus:ring-2 focus:ring-accent/[0.06]` |
| Active environment pill | `bg-accent/[0.06] border-accent/[0.18] text-accent` |
| Active request/response tabs | `border-b-accent text-accent` |
| Send button | `bg-accent text-[#0d1117] hover:brightness-110` |
| Save button (hover) | `hover:border-accent/[0.18] hover:text-accent` |
| Drag resize handles | `hover:bg-accent/30` |
| Drag handle dots | `bg-accent/20` |
| cURL preview text | `text-accent` |
| KV table input focus | `focus:border-accent/[0.18]` |
| "+ Add row" / "+ New env" links | `text-accent` |
| Import cURL button | `bg-accent/[0.06] border-accent/[0.18] text-accent hover:bg-accent/10` |
| Success notification | `bg-accent/[0.12] border-accent/[0.18] text-accent` |
| Modal active env item | `bg-accent/[0.06] border-accent/[0.18] text-accent` |
| Modal save button | `bg-accent text-[#0d1117]` |

> **Note:** Scrollbar styling and JSON syntax-highlight colours cannot use Tailwind classes and remain as inline styles / a minimal global CSS block in `index.css`.

#### Design Constraints

- **No surface exceeds 12% opacity** for background washes — the tint is felt, not seen
- **Only one fully-solid surface**: the Send button. Everything else is transparent/tinted
- **Transition**: the logo dot uses `transition-colors duration-300`; all other surfaces change instantly to avoid lag during rapid method switching
- **Method badge colours are static** Tailwind classes (e.g. `bg-emerald-500/20 text-emerald-400`) — they always show their own fixed colour regardless of the active method, since they serve as a persistent visual legend
| **Request timing breakdown** | DNS · TCP · TLS · TTFB · Download (shown as a horizontal bar chart) |

---

## 5. Pages & Routes

Using Next.js 15 App Router. All UI pages are Client Components (`"use client"`) — IndexedDB, Zustand, and the interactive editor require browser APIs. The proxy route is the only Server Component / Route Handler.

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Main app — left panel + right panel |
| `/settings` | `app/settings/page.tsx` | Theme, proxy override, SSL, keyboard shortcuts, data management |
| `/environments` | `app/environments/page.tsx` | Full-page environment manager (also accessible as modal) |
| `/import` | `app/import/page.tsx` | Drag-and-drop import (collections, Postman JSON, HAR files) |
| `/api/proxy` | `app/api/proxy/route.ts` | **Server-side proxy** — all outbound API calls route through here (see §8) |

Navigation between UI routes uses Next.js `<Link>` / `useRouter` and keeps the left panel and active request state intact via Zustand (state lives outside the page component tree).

---

## 6. Data Persistence (IndexedDB via `idb`)

All data stored client-side. No accounts, no sync in v1.

| Store | Key | Value |
|---|---|---|
| `collections` | `collectionId` | `{ id, name, createdAt, order }` |
| `requests` | `requestId` | `{ id, collectionId, name, method, url, params, headers, auth, body, scripts, createdAt, updatedAt }` |
| `environments` | `envId` | `{ id, name, isGlobal, variables: [{key, value, secret}] }` |
| `history` | `historyId` | `{ id, requestSnapshot, response: { status, time, size, body, headers }, sentAt }` |
| `tabs` | `tabId` | `{ id, requestId?, unsavedState?, isActive }` |
| `settings` | `'app'` | `{ theme, proxyUrl, sslVerify, followRedirects, activeEnvId }` |

Zustand stores (in-memory) are hydrated from IndexedDB on app load. Writes flow: UI action → Zustand → IndexedDB (async, fire-and-forget with error toast on failure).

---

## 7. State Management — Why Zustand + Native fetch (No TanStack Query)

**TanStack Query is intentionally excluded** because:

- TanStack Query is optimised for *data fetching with caching* — perfect for news feeds, dashboards, REST CRUD UIs that repeatedly fetch the same resources
- An API tester sends **arbitrary, one-off, user-triggered requests** — there is no "stale data" or "background refetch" concept. Every Send is imperative
- Caching responses would be actively harmful (tester needs to see live server responses)
- Loading/error state for a single send-request action is trivially managed with `useState` + `useReducer`

**Zustand** handles all application state:

| Store | State | Actions |
|---|---|---|
| `useTabsStore` | `tabs[]`, `activeTabId` | `openTab`, `closeTab`, `setActive`, `updateTabState` |
| `useCollectionsStore` | `collections[]`, `requests[]` | `createCollection`, `addRequest`, `updateRequest`, `deleteRequest`, `moveRequest` |
| `useEnvironmentsStore` | `environments[]`, `activeEnvId` | `createEnv`, `updateEnv`, `deleteEnv`, `setActive`, `resolveVariables` |
| `useHistoryStore` | `history[]` | `addEntry`, `clearHistory`, `deleteEntry` |
| `useResponseStore` | `responses: { [tabId]: ResponseData }` | `setResponse`, `clearResponse`, `setLoading`, `setError` |
| `useSettingsStore` | `theme`, `proxyUrl`, `sslVerify`, `followRedirects` | `setSetting` |
| `useUIStore` | `leftPanelWidth`, `splitRatio`, `commandPaletteOpen` | `setLeftWidth`, `setSplitRatio`, `toggleCommandPalette` |

All stores persist to IndexedDB via a custom Zustand middleware (not localStorage — IndexedDB for larger payloads and binary-safe storage).

---

## 8. Proxy Route — CORS Architecture

### Why a proxy is required

Browsers enforce the **Same-Origin Policy**: when your app at `requestly.vercel.app` tries to fetch `api.stripe.com`, the browser first sends a preflight `OPTIONS` request. If the target server doesn't respond with `Access-Control-Allow-Origin: *` (or your specific origin), the browser blocks the response entirely — your `fetch()` call never sees it.

This affects **every** browser-based API tester. Tools like HTTPie web app, Postman web client, and Insomnia all solve this the same way: route all user requests through a server-side proxy on their own domain. The browser talks same-origin to the proxy; the proxy makes the real request server-to-server where CORS doesn't exist.

### Why Next.js is the right choice here

With a Vite SPA on Vercel you'd need a separately deployed proxy service. With Next.js, the proxy is just a Route Handler file in the same codebase — same repo, same deployment, same domain. Zero additional infrastructure.

```
Browser → /api/proxy (same origin, no CORS) → Target API (server-to-server, no CORS)
```

### Implementation — `app/api/proxy/route.ts`

```ts
export async function POST(request: Request) {
  const { url, method, headers, body } = await request.json();

  if (!url) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  const targetHeaders = new Headers(headers);
  // Replace host header so the target server receives the correct value
  targetHeaders.set("host", new URL(url).host);
  // Remove browser headers that would cause issues server-side
  targetHeaders.delete("origin");
  targetHeaders.delete("referer");

  const upstream = await fetch(url, {
    method,
    headers: targetHeaders,
    body: ["GET", "HEAD"].includes(method) ? undefined : body,
  });

  const responseBody = await upstream.text();

  // Forward upstream response headers back to the browser
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    // Skip hop-by-hop headers that are not safe to forward
    if (!["transfer-encoding", "connection", "keep-alive"].includes(key)) {
      responseHeaders.set(key, value);
    }
  });

  return new Response(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
```

### Client-side call — `lib/requestRunner.ts`

The frontend never fetches the target URL directly. It always POSTs to `/api/proxy`:

```ts
export async function runRequest(req: ResolvedRequest): Promise<ResponseData> {
  const start = performance.now();

  const res = await fetch("/api/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url:     req.url,
      method:  req.method,
      headers: req.headers,
      body:    req.body ?? null,
    }),
  });

  const duration = Math.round(performance.now() - start);
  const text = await res.text();

  return {
    status:   res.status,
    statusText: res.statusText,
    duration,
    size:     new TextEncoder().encode(text).length,
    body:     text,
    headers:  Object.fromEntries(res.headers.entries()),
  };
}
```

### Localhost API limitation

The proxy runs on Vercel's servers — it cannot reach APIs running on `localhost` on the user's machine. This is a fundamental constraint of any web-based tool (HTTPie, Postman web, etc. all have the same limitation).

**Mitigation options surfaced in the UI:**
- Settings panel shows a **"Proxy Override URL"** field — the user can point this at a self-hosted proxy (e.g. a local `cors-anywhere` instance at `http://localhost:8080`) for local API testing
- A persistent banner appears when the URL contains `localhost` or `127.0.0.1`, suggesting the proxy override

**Future v2:** a lightweight companion CLI (`npx requestly-agent`) that runs a local proxy and registers itself automatically — same pattern as Postman's desktop agent.

---

## 9. cURL Parser — Implementation Notes

Parse a raw cURL string using regex + state machine:

```ts
type ParsedCurl = {
  method: HttpMethod;
  url: string;
  headers: KVPair[];
  params: KVPair[];  // extracted from URL query string
  body: { type: BodyType; content: string } | null;
  auth: AuthConfig | null;
}
```

Patterns to handle:
- `-X METHOD` or `--request METHOD` → method
- `-H "Key: Value"` or `--header "Key: Value"` → headers
- `-d '...'` / `--data '...'` / `--data-raw '...'` / `--data-binary '...'` → body
- `-u user:pass` → Basic Auth
- URL (bare or quoted, with or without `-G`)
- Multi-line cURL (backslash line continuation)
- Auto-detect body content-type: attempt `JSON.parse()` → raw JSON; else form-encoded

---

## 10. Component Structure

```
src/
  app/
    layout.tsx                        # Root layout — fonts, theme provider
    page.tsx                          # Main app — mounts <MainLayout> (Client Component)
    settings/
      page.tsx
    environments/
      page.tsx
    import/
      page.tsx
    api/
      proxy/
        route.ts                      # ★ Server-side proxy Route Handler (see §8)
  components/
    layout/
      MainLayout.tsx                # "use client" — left panel + right panel
      LeftPanel.tsx                 # Sidebar: logo, env selector, collections, history
      RightPanel.tsx                # URL bar + tabs + response
      ResizablePanel.tsx            # Draggable splitter wrapper
    request/
      UrlBar.tsx                    # Method selector + URL input + send + save
      RequestTabs.tsx               # Params | Headers | Auth | Body | cURL | Scripts
      ParamsEditor.tsx              # KV table with toggle
      HeadersEditor.tsx             # KV table with header name autocomplete
      AuthEditor.tsx                # Auth type switcher
      BodyEditor.tsx                # Body type switcher + editor
      CurlEditor.tsx                # cURL import/export textarea
      ScriptEditor.tsx              # Pre/post request JS editor
    response/
      ResponsePanel.tsx             # Status + meta + tabs
      PrettyViewer.tsx              # Syntax-highlighted collapsible tree
      RawViewer.tsx                 # Plain text
      HeadersViewer.tsx             # KV table
      PreviewFrame.tsx              # Sandboxed iframe
      CookiesViewer.tsx
      TimingBar.tsx                 # Request timing breakdown chart
    collections/
      CollectionTree.tsx            # Accordion list
      CollectionItem.tsx            # Folder row with kebab menu
      RequestItem.tsx               # Request row with method badge + kebab
      SaveRequestModal.tsx          # Pick/create collection modal
    history/
      HistoryList.tsx               # Recent requests list
      HistoryItem.tsx               # Single row: method badge + URL + time + status
    environments/
      EnvSelector.tsx               # Dropdown in left panel
      EnvEditorModal.tsx            # KV table editor
      EnvEditorPage.tsx             # Full-page version
    common/
      MethodBadge.tsx               # GET/POST/etc colour-coded pill
      StatusBadge.tsx               # 200/404/500 colour-coded pill
      KVTable.tsx                   # Reusable key-value editor with toggle
      CommandPalette.tsx            # Cmd+K overlay
      EmptyState.tsx
      ErrorToast.tsx
      ConfirmDialog.tsx
      Tooltip.tsx
  hooks/
    useSendRequest.ts               # Calls /api/proxy; handles env variable resolution + response parsing
    useCurlParser.ts                # Parses a curl string → ParsedCurl
    useCurlGenerator.ts             # Current request state → curl string
    useMethodTheme.ts               # Sets --accent-r/g/b CSS vars on method change
    useKeyboardShortcuts.ts
    useResizable.ts                 # Drag-resize logic
    useIndexedDB.ts                 # idb wrapper hook
  store/
    tabsStore.ts
    collectionsStore.ts
    environmentsStore.ts
    historyStore.ts
    responseStore.ts
    settingsStore.ts
    uiStore.ts
  lib/
    curlParser.ts                   # Pure cURL parse function
    curlGenerator.ts                # Pure cURL generate function
    variableResolver.ts             # {{VAR}} → value substitution
    idb.ts                          # IndexedDB schema + connection
    requestRunner.ts                # POSTs to /api/proxy — never fetches target URL directly
    constants.ts                    # METHOD_PALETTE, HTTP_METHODS, etc.
    utils.ts                        # formatBytes, formatDuration, cn(), etc.
  types/
    request.ts                      # HttpMethod, KVPair, AuthConfig, BodyConfig, RequestModel
    response.ts                     # ResponseData, TimingData
    collection.ts                   # CollectionModel, RequestModel
    environment.ts                  # EnvironmentModel, Variable
    history.ts                      # HistoryEntry
```

---

## 11. Tech Stack Rationale

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | Solves CORS natively via Route Handlers — no separate proxy service needed. Same repo, same domain, one deployment. |
| Deployment | Vercel | First-class Next.js support; Route Handlers deploy as serverless functions automatically |
| Styling | Tailwind CSS | Utility-first; `accent` colour token wired to CSS variables enables method-driven theming with standard opacity modifiers (`bg-accent/10` etc.) |
| Components | shadcn/ui | Radix primitives, unstyled but accessible; owned in `components/ui`, not a black-box dependency |
| State | Zustand | Minimal boilerplate; slice pattern fits domain; persists to IndexedDB via custom middleware |
| Persistence | IndexedDB via `idb` | No size limits for large response bodies; binary-safe; survives page refresh unlike in-memory state |
| Data fetching | Native `fetch` to `/api/proxy` | User-initiated, one-off, imperative — no caching needed; TanStack Query would be counterproductive here |
| Code editor | CodeMirror 6 | Lightweight, extensible; used for JSON body, scripts, raw response viewer |
| Routing | Next.js App Router | Built-in; no React Router needed |
| cURL parsing | Custom (`lib/curlParser.ts`) | No suitable small library; a state-machine parser is ~150 lines |
| Drag-and-drop | `@dnd-kit/core` | Accessible, works inside complex scroll containers |

---

## 12. Non-Functional Requirements

| Requirement | Target |
|---|---|
| First load (empty cache) | < 1.5s on broadband |
| Time to first request sent | < 5s from page open |
| Keyboard-navigable | All major actions reachable without mouse |
| Accessibility | WCAG 2.1 AA for all chrome (not response body) |
| Response payload display | Up to 10MB rendered; beyond that, truncated with download CTA |
| Mobile support | Usable on tablet (768px+); left panel collapses to drawer |
| Error resilience | Network errors surfaced inline; IndexedDB failures toast only (non-blocking) |
| TypeScript | Strict mode; zero `any` types |
| Browser support | Latest 2 versions of Chrome, Firefox, Safari, Edge |

---

## 13. Out of Scope (v1)

- User authentication or cloud sync
- Team collaboration / shared collections in real-time
- GraphQL or gRPC support (HTTP/REST only)
- WebSocket or SSE testing
- Mock server / response mocking
- Test runner / automated collection runs (manual only)
- Full OAuth 2.0 flow (token entry only)
- HAR file import (listed in import page but behind a coming-soon gate)
- Desktop app / Electron wrapper
- `localhost` API testing without a proxy override (web constraint — documented in §8)

---

## 14. Suggested Future Enhancements (v2+)

- **`requestly-agent` CLI** — `npx requestly-agent` spins up a local proxy that the app detects automatically, enabling `localhost` API testing from the deployed web app — same pattern as Postman's desktop agent
- **Cloud sync** — Optional account to sync collections + envs across devices
- **Team workspaces** — Share collections and environments with teammates; real-time conflict resolution
- **GraphQL support** — Schema introspection, query builder, variable editor
- **WebSocket & SSE** — Persistent connection testing with message log
- **Automated test runner** — Run a collection sequentially with assertions; pass/fail report
- **CI integration** — Export collection as a Requestly CLI test suite
- **Mock server** — Define response rules per endpoint; serve locally from the browser via Service Worker
- **Diff tool** — Side-by-side response comparison between two history entries or two environments
- **AI assist** — Describe an API call in natural language → auto-populate the request builder
- **HAR import** — Import browser DevTools HAR exports as a collection
- **Plugin system** — Custom auth schemes, body transformers, response visualisers