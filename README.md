# Requestr

A browser-native API testing tool. No install, no account, no CORS headaches — just open and test.

> Inspired by Postman and Requestr, built entirely for the browser with all data stored locally.

---

## Features

- **Multi-tab workspace** — open and switch between multiple requests simultaneously
- **Request builder** — full support for params, headers, auth (Bearer, Basic, API Key), and request body (JSON, form, x-www-form-urlencoded)
- **cURL import/export** — paste any curl command to populate fields; export any request as curl
- **Environment variables** — multiple named environments (Local, Staging, Prod) with `{{VAR_NAME}}` interpolation in URLs, headers, and body
- **Collections** — organize requests into folders with drag-and-drop reordering, rename, duplicate, and export/import (Postman v2.1 compatible)
- **Request history** — last 200 requests auto-saved and searchable by URL or method
- **Pre/post-request scripts** — JS snippets with `env.set('KEY', 'value')` for request chaining
- **Response viewer** — Pretty (syntax-highlighted), Raw, Headers, Preview (sandboxed iframe), and Cookies tabs
- **Method-driven theming** — UI accent color shifts dynamically per HTTP method (GET=emerald, POST=blue, PUT=amber, PATCH=purple, DELETE=red)
- **Dark/light/system theme** — persistent, no flicker
- **Zero CORS issues** — all outbound requests route through a Next.js server-side proxy

---

## Tech Stack

| Category         | Technology                             |
| ---------------- | -------------------------------------- |
| Framework        | Next.js 16 (App Router)                |
| UI               | React 19 + Tailwind CSS v4 + shadcn/ui |
| State            | Zustand                                |
| Persistence      | IndexedDB (via `idb`)                  |
| Code editor      | CodeMirror 6                           |
| Drag and drop    | dnd-kit                                |
| Panels           | react-resizable-panels                 |
| Command palette  | cmdk                                   |
| Toasts           | Sonner                                 |
| Icons            | Lucide React                           |
| Linter/formatter | Biome                                  |
| Package manager  | Bun                                    |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Main workspace
│   ├── layout.tsx                # Root layout (fonts, providers)
│   ├── globals.css               # CSS variables + base styles
│   ├── api/proxy/route.ts        # Server-side CORS proxy
│   ├── environments/             # Environment manager page
│   ├── import/                   # Import collections/curl page
│   └── settings/                 # Settings page
├── components/
│   ├── layout/                   # MainLayout, LeftPanel, RightPanel, TabBar
│   ├── request/                  # UrlBar, RequestTabs, ParamsEditor, HeadersEditor,
│   │                             # AuthEditor, BodyEditor, CurlEditor, ScriptEditor
│   ├── response/                 # ResponsePanel, PrettyViewer, RawViewer,
│   │                             # HeadersViewer, PreviewFrame
│   ├── collections/              # CollectionTree, RequestItem, SaveRequestModal
│   ├── environment/              # EnvSelector, EnvEditorPage
│   ├── history/                  # HistoryList, HistoryItem
│   ├── common/                   # MethodBadge, StatusBadge, KVTable,
│   │                             # CommandPalette, EnvAutocompleteInput
│   └── ui/                       # shadcn primitives (accordion, badge, dialog, etc.)
├── stores/                       # Zustand stores (tabs, collections, environments,
│                                 # history, response, settings, ui)
├── hooks/                        # useSendRequest, useMethodTheme,
│                                 # useKeyboardShortcuts, useEnvVariableKeys
├── lib/                          # curlParser, curlGenerator, variableResolver,
│                                 # requestRunner, idb, constants, utils
├── types/                        # Centralized TypeScript types
└── providers/                    # AppProviders (theme, Zustand hydration)
```

---

## Getting Started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other commands

```bash
bun run build     # Production build
bun run start     # Start production server
bun run lint      # Run Biome linter
bun run format    # Auto-format with Biome
```

---

## Architecture

### CORS Proxy

All outbound API requests are routed through `/api/proxy` — a Next.js Route Handler that makes the actual HTTP call server-to-server, bypassing browser CORS restrictions entirely. This matches the architecture used by Postman Web and HTTPie Web.

### Local Persistence

All data is stored in IndexedDB via `idb`. There is no backend, no database, and no account required. Zustand stores are hydrated from IndexedDB on app load; writes are async and fire-and-forget.

| IndexedDB Store | Contents                                                                |
| --------------- | ----------------------------------------------------------------------- |
| `collections`   | Collection folders                                                      |
| `requests`      | Individual requests (method, URL, headers, body, params, auth, scripts) |
| `environments`  | Environment definitions and variables                                   |
| `history`       | Last 200 requests with responses                                        |
| `tabs`          | Open tab state                                                          |
| `settings`      | Theme, proxy URL, SSL toggle, follow-redirects, active env              |

### Method-Driven Theming

The HTTP method updates CSS custom properties (`--method-accent-r/g/b`) via the `useMethodTheme` hook. Tailwind's `accent` color token reads these at runtime, so every `bg-accent`, `border-accent`, `text-accent` class shifts in sync with the selected method.

---

## Keyboard Shortcuts

| Shortcut      | Action               |
| ------------- | -------------------- |
| `Cmd + Enter` | Send request         |
| `Cmd + S`     | Save request         |
| `Cmd + N`     | New tab              |
| `Cmd + K`     | Open command palette |

---

## Data Privacy

All request data, collections, environments, and history live entirely in your browser's IndexedDB. Nothing is sent to any external server except the API calls you explicitly make (proxied through the local Next.js server).

---

## Deployment

Designed for [Vercel](https://vercel.com). The proxy route deploys as a serverless function automatically. No additional configuration required.

---

## Roadmap

- `requestr-agent` CLI for testing localhost APIs
- HAR file import
- WebSocket and SSE testing
- Automated test runner with assertions
- Cloud sync (optional account)
- Team workspaces with shared collections
- GraphQL support
