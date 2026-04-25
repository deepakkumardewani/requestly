# TASKS.md — GraphQL, WebSocket, and Socket.IO Support

**Version:** 1.0
**Date:** 2026-04-14

---

## Dependency Installation (Do First)

```bash
bun add socket.io-client
```

| Package | Version | Used by |
|---|---|---|
| `socket.io-client` | latest | Socket.IO tab — connect/emit/receive |

WebSocket uses the native browser `WebSocket` API (no package needed).
GraphQL uses the existing fetch/proxy setup (no package needed).

---

## Phase 1 — Type System & Constants

### Task 1.1 — Add `TAB_TYPES` and `MAX_WS_LOG_ENTRIES` to constants
**File:** `src/lib/constants.ts`
- Add `TAB_TYPES = { HTTP: "http", GRAPHQL: "graphql", WEBSOCKET: "websocket", SOCKETIO: "socketio" } as const`
- Add `TabType = typeof TAB_TYPES[keyof typeof TAB_TYPES]` — re-export from types, or define here
- Add `MAX_WS_LOG_ENTRIES = 1000`

### Task 1.2 — Refactor `TabState` into a discriminated union
**File:** `src/types/index.ts`
- Add `TabType = "http" | "graphql" | "websocket" | "socketio"`
- Add `WsMessage = { id: string; direction: "sent" | "received"; data: string; timestamp: number }`
- Define `BaseTab` with shared fields: `tabId, requestId, name, isDirty, type, url, headers: KVPair[]`
- Define `HttpTab` (extends BaseTab): keeps existing `method, params, auth, body, preScript, postScript`
- Define `GraphQLTab` (extends BaseTab): `query: string, variables: string, operationName: string, auth: AuthConfig`
- Define `WebSocketTab` (extends BaseTab): `messageLog: WsMessage[]`
- Define `SocketIOTab` (extends BaseTab): `messageLog: WsMessage[]`
- Replace `TabState` export with: `type TabState = HttpTab | GraphQLTab | WebSocketTab | SocketIOTab`
- Update `RequestModel` and `HistoryEntry` to reference `HttpTab` only (they're HTTP-only concepts)

---

## Phase 2 — Store Updates

### Task 2.1 — Update `useTabsStore` for multi-type tabs
**File:** `src/stores/useTabsStore.ts`
- Update `createEmptyTab` to branch on `overrides.type`:
  - `"http"` (default): existing defaults
  - `"graphql"`: `{ name: "New GraphQL", query: "", variables: "{}", operationName: "", auth: { type: "none" } }`
  - `"websocket"`: `{ name: "New WebSocket", url: "wss://", messageLog: [] }`
  - `"socketio"`: `{ name: "New Socket.IO", url: "http://", messageLog: [] }`
- Fix type imports to use new union

### Task 2.2 — Create `useConnectionStore`
**File:** `src/stores/useConnectionStore.ts` (**NEW**)
```ts
type ConnectionState = {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
};
type ConnectionStore = {
  connections: Record<string, ConnectionState>;
  connect: (tabId: string, url: string, type: "websocket" | "socketio") => void;
  disconnect: (tabId: string) => void;
  setError: (tabId: string, err: string) => void;
};
```
- `connect`: opens native `WebSocket` (for websocket type) or `io()` (for socketio type); stores socket ref in a separate non-reactive map `socketRefs: Map<tabId, WebSocket | Socket>`
- On `ws.onmessage` / `socket.on("message")`: dispatch to `useTabsStore.updateTabState` to append to `tab.messageLog` (capped at `MAX_WS_LOG_ENTRIES`)
- `disconnect`: calls `ws.close()` / `socket.disconnect()`, removes from socketRefs, sets `isConnected = false`
- No IndexedDB persistence — ephemeral

---

## Phase 3 — CreateNewDropdown

### Task 3.1 — Pass tab type when opening tabs
**File:** `src/components/layout/CreateNewDropdown.tsx`
- Import `TAB_TYPES` from `@/lib/constants`
- Change: `openTab({ type: TAB_TYPES.HTTP })`
- Change: `openTab({ type: TAB_TYPES.GRAPHQL })`
- Change: `openTab({ type: TAB_TYPES.WEBSOCKET })`
- Change: `openTab({ type: TAB_TYPES.SOCKETIO })`

---

## Phase 4 — Request Tab UI

### Task 4.1 — Create `HttpTabs`
**File:** `src/components/request/tabs/HttpTabs.tsx` (**NEW**)
- Extract all existing HTTP tab content from `RequestTabs.tsx` into this component (verbatim move)
- Props: `{ tabId: string }`
- Tabs: Params, Headers, Auth, Body, cURL, Scripts (unchanged from current `RequestTabs`)

### Task 4.2 — Create `GraphQLTabs`
**File:** `src/components/request/tabs/GraphQLTabs.tsx` (**NEW**)
- Props: `{ tabId: string }`
- Tabs: **Query**, **Variables**, **Headers**, **Auth**
- Query tab: CodeMirror editor (reuse existing dynamic import pattern), `data-testid="graphql-query-editor"`; updates `tab.query`
- Variables tab: CodeMirror JSON editor, `data-testid="graphql-variables-editor"`; updates `tab.variables`
- Headers tab: reuse `<HeadersEditor tabId={tabId} />`
- Auth tab: reuse `<AuthEditor tabId={tabId} />`

### Task 4.3 — Create `MessageLog`
**File:** `src/components/request/MessageLog.tsx` (**NEW**)
- Props: `{ messages: WsMessage[]; onClear: () => void }`
- Renders messages in a scrollable list; sent = right-aligned blue, received = left-aligned green
- Each row: timestamp, direction badge, message data
- "Clear" button at top right — `data-testid="message-log-clear-btn"`
- `data-testid="message-log"`

### Task 4.4 — Create `WebSocketTabs`
**File:** `src/components/request/tabs/WebSocketTabs.tsx` (**NEW**)
- Props: `{ tabId: string }`
- Tabs: **Messages**, **Headers**
- Messages tab:
  - Textarea for message input, `data-testid="ws-message-input"`
  - "Send" button (disabled if not connected), `data-testid="ws-send-btn"` — calls `socketRefs.get(tabId)?.send(value)`; dispatches sent message to store
  - `<MessageLog>` below
- Headers tab: reuse `<HeadersEditor tabId={tabId} />`

### Task 4.5 — Create `SocketIOTabs`
**File:** `src/components/request/tabs/SocketIOTabs.tsx` (**NEW**)
- Props: `{ tabId: string }`
- Same structure as `WebSocketTabs` but Messages tab has an additional EventName input above the message textarea
- EventName input: `data-testid="socketio-event-input"`, updates local state (not persisted — defaults to "message")
- Send button: `data-testid="socketio-send-btn"` — calls `socket.emit(eventName, value)`

### Task 4.6 — Update `RequestTabs` to branch on type
**File:** `src/components/request/RequestTabs.tsx`
- Replace all existing tab markup with:
  ```tsx
  if (tab.type === "http") return <HttpTabs tabId={tabId} />;
  if (tab.type === "graphql") return <GraphQLTabs tabId={tabId} />;
  if (tab.type === "websocket") return <WebSocketTabs tabId={tabId} />;
  if (tab.type === "socketio") return <SocketIOTabs tabId={tabId} />;
  ```
- Import new tab components

---

## Phase 5 — URL Bar

### Task 5.1 — Update `UrlBar` for multi-type
**File:** `src/components/request/UrlBar.tsx`
- Read `tab.type` to determine rendering:
  - **HTTP**: unchanged (method selector + URL + Copy cURL + Share + Save + Send)
  - **GraphQL**: replace method selector with a static "GQL" badge; remove Copy cURL button; keep URL + Save + Send
  - **WebSocket / Socket.IO**: replace method selector with type label badge ("WS" / "SIO"); remove Copy cURL + Share + Send buttons; add `ConnectButton` component
- Extract `ConnectButton` logic into `src/components/request/ConnectButton.tsx` (**NEW**)
  - Props: `{ tabId: string; type: "websocket" | "socketio" }`
  - Reads `useConnectionStore` for `isConnected` / `isConnecting`
  - Renders: "Connect" (green) / "Connecting…" (spinner) / "Disconnect" (red)
  - `data-testid="connect-btn"` / `data-testid="disconnect-btn"`

---

## Phase 6 — Tab Label & Icons

### Task 6.1 — Update `Tab` component with type-based icons
**File:** `src/components/layout/Tab.tsx`
- Import icons: `Globe, Braces, ArrowLeftRight, Zap` from lucide-react
- Show icon based on `tab.type`: Globe (http), Braces (graphql), ArrowLeftRight (websocket), Zap (socketio)
- For WS/SocketIO tabs: show a green dot if `useConnectionStore` reports `isConnected` for that tabId
- `data-testid="tab-connection-dot"` on the indicator

---

## Phase 7 — CodeGenPanel

### Task 7.1 — Restrict CodeGenPanel to HTTP only
**File:** `src/components/request/CodeGenPanel.tsx`
- Add guard at top: `if (tab.type !== "http") return null;`

---

## Phase 8 — GraphQL Send Logic

### Task 8.1 — Update `useSendRequest` hook or proxy for GraphQL
**File:** `src/hooks/useSendRequest.ts` (check if this exists; otherwise `src/lib/sendRequest.ts`)
- For `tab.type === "graphql"`: build a POST request body `{ query, variables: JSON.parse(variables), operationName }` with `Content-Type: application/json`
- Send via existing proxy (`/api/proxy`) — no new route needed
- Response displayed in existing `ResponsePanel` (unchanged)

---

## Phase 9 — E2E Scenarios

### Task 9.1 — Create GraphQL scenario
**File:** `e2e/scenarios/graphql.feature.md` (**NEW**)
- Feature: GraphQL Requests
- Scenarios: Send a query, Use variables, Set custom headers

### Task 9.2 — Create WebSocket scenario
**File:** `e2e/scenarios/websocket.feature.md` (**NEW**)
- Feature: WebSocket Connections
- Scenarios: Connect, Send message, Receive message in log, Disconnect

### Task 9.3 — Create Socket.IO scenario
**File:** `e2e/scenarios/socketio.feature.md` (**NEW**)
- Feature: Socket.IO Connections
- Scenarios: Connect, Emit event with data, Receive event in log, Disconnect

---

## Phase 10 — E2E Specs

### Task 10.1 — Create `e2e/graphql.spec.ts`
- `beforeEach`: clearTabsDB, goto `/`, open GraphQL tab via dropdown (`create-new-dropdown-trigger` → click "GraphQL")
- Test: GraphQL tab opens with Query/Variables/Headers/Auth tabs visible
- Test: Enter query `{ countries { code name } }` in query editor, send to `https://countries.trevorblades.com/`, verify 200 and JSON in response panel
- Test: Enter variable in Variables tab, reference `$var` in query, verify response resolves it

### Task 10.2 — Create `e2e/websocket.spec.ts`
- Test: WebSocket tab opens with Connect button, message input, message log visible
- Test: Connect to `wss://echo.websocket.org` → `connect-btn` becomes `disconnect-btn`
- Test: Send "hello" → appears in log as "sent"
- Test: Echo response "hello" appears in log as "received"
- Test: Disconnect → `disconnect-btn` becomes `connect-btn`

### Task 10.3 — Create `e2e/socketio.spec.ts`
- Test: Socket.IO tab opens with EventName input, Connect button, message log visible
- (Full connection tests can be skipped or marked as `test.skip` if no public Socket.IO test server is available; note this in comments)

---

## File Summary

| File | Action |
|------|--------|
| `src/lib/constants.ts` | Modify |
| `src/types/index.ts` | Modify |
| `src/stores/useTabsStore.ts` | Modify |
| `src/stores/useConnectionStore.ts` | **Create** |
| `src/components/layout/CreateNewDropdown.tsx` | Modify |
| `src/components/request/RequestTabs.tsx` | Modify |
| `src/components/request/tabs/HttpTabs.tsx` | **Create** |
| `src/components/request/tabs/GraphQLTabs.tsx` | **Create** |
| `src/components/request/tabs/WebSocketTabs.tsx` | **Create** |
| `src/components/request/tabs/SocketIOTabs.tsx` | **Create** |
| `src/components/request/MessageLog.tsx` | **Create** |
| `src/components/request/ConnectButton.tsx` | **Create** |
| `src/components/request/UrlBar.tsx` | Modify |
| `src/components/layout/Tab.tsx` | Modify |
| `src/components/request/CodeGenPanel.tsx` | Modify |
| `src/hooks/useSendRequest.ts` | Modify |
| `e2e/scenarios/graphql.feature.md` | **Create** |
| `e2e/scenarios/websocket.feature.md` | **Create** |
| `e2e/scenarios/socketio.feature.md` | **Create** |
| `e2e/graphql.spec.ts` | **Create** |
| `e2e/websocket.spec.ts` | **Create** |
| `e2e/socketio.spec.ts` | **Create** |
