# TASKS.md — Chaining UI: 6 Enhancement Features

**Version:** 1.0
**Date:** 2026-03-31

---

## Dependency Installation (Do First)

```bash
bun add dagre @types/dagre
```

| Package | Version | Used by |
|---|---|---|
| `dagre` | latest | Epic 3 — Canvas Usability (auto-layout) |
| `@types/dagre` | latest | TypeScript types for dagre |

All other features use `jsonpath-plus` (already installed), existing Zustand stores, shadcn primitives, and hand-rolled utilities. No other new packages required.

---

## Epic 1 — Interactive Visual Data Mapper

**Complexity:** Low-Medium
**New files:** `src/components/chain/JsonPathExplorer.tsx`
**Modified files:** `src/components/chain/ArrowConfigPanel.tsx`

---

### Task 1.1 — Confirm `ResponseData` shape

- [ ] Read `src/types/` to locate the `ResponseData` type definition
- [ ] Confirm the exact field name and type for the response body (`string` vs `object`)
- [ ] Note whether body arrives pre-parsed or as raw JSON string

---

### Task 1.2 — Build `JsonPathExplorer` component (`src/components/chain/JsonPathExplorer.tsx`)

- [ ] Define props:
  ```ts
  type JsonPathExplorerProps = {
    data: object
    selectedPath?: string
    onSelect: (path: string) => void
  }
  ```
- [ ] Implement `buildPath(parentPath: string, key: string | number): string`
  - Arrays: `parentPath + '[' + key + ']'` → e.g. `$.items[0]`
  - Objects: `parentPath + '.' + key` → e.g. `$.data.user`
  - Root call passes `'$'` as parentPath
- [ ] Implement recursive `JsonNode` sub-component:
  - Props: `{ path, nodeKey, value, depth, onSelect, selectedPath }`
  - If `value` is object/array: render shadcn `Collapsible` with key label + child count badge; default open for depth ≤ 2
  - If `value` is a primitive (string/number/boolean/null): render as a clickable row
    - Show key name in muted foreground, value preview (truncated at 40 chars) in accent color
    - On click: call `onSelect(path)`
  - Cap recursive render at depth 6; beyond that render a `"…"` placeholder row
- [ ] Highlight selected path: if `path === selectedPath`, add a distinct background on the row and a checkmark icon
- [ ] Wrap entire tree in shadcn `ScrollArea` with max-height `300px`
- [ ] Empty/null guard: if `data` is not a parseable object, render nothing

---

### Task 1.3 — Integrate `JsonPathExplorer` into `ArrowConfigPanel`

- [ ] In `ArrowConfigPanel.tsx`, attempt to parse `sourceResponse.body` as JSON in a `useMemo`:
  ```ts
  const parsedBody = useMemo(() => {
    try { return JSON.parse(sourceResponse?.body ?? '') }
    catch { return null }
  }, [sourceResponse?.body])
  ```
- [ ] In the extraction section, replace the bare `<Input>` for `sourceJsonPath` with a shadcn `Tabs` layout:
  - **"Explorer" tab** (shown first, default): renders `<JsonPathExplorer>` + the path input below it (read-only, showing the selected path)
  - **"Manual" tab**: renders the existing editable `<Input>` for direct typing
- [ ] On `JsonPathExplorer` `onSelect`: call `setSourceJsonPath(path)`; auto-switch to Manual tab momentarily or show the filled value below the tree
- [ ] If `parsedBody === null` (non-JSON body): hide the Explorer tab; show Manual tab only; display a `<p>` note: `"Response is not JSON — enter a JSONPath manually."`
- [ ] If `sourceResponse` is undefined/null: hide Explorer tab; show an inline prompt: `"Run the source request first to use the visual explorer."` with the existing `onRunSource` button

---

### Task 1.4 — Edge case handling

- [ ] When `ArrowConfigPanel` opens with `existingEdge.sourceJsonPath` set, pass it as `selectedPath` to `JsonPathExplorer` so the matching node is highlighted
- [ ] Arrays: ensure clicking an array element emits `$.items[0]` style path (integer index in brackets)
- [ ] Very long string values truncated to 40 chars in the preview, with a `…` suffix
- [ ] Boolean `false` and `null` values are still rendered (not falsy-skipped)

---

### Task 1.5 — Manual test

- [ ] Run a source API that returns a nested JSON body → Explorer tab shows tree, all levels expandable
- [ ] Click a leaf value → `sourceJsonPath` input auto-fills with correct JSONPath
- [ ] Verify the existing "Extract preview" line updates immediately after selection
- [ ] Open panel with existing edge → previously saved path is highlighted in tree
- [ ] Run source API that returns plain text (non-JSON) → Explorer tab hidden, Manual tab shown with note
- [ ] Panel opened with no run state → prompt + "Run Source API" button shown

---

## Epic 2 — Expanded Extraction Sources

**Complexity:** Medium
**New files:** `src/components/chain/JsSnippetEditor.tsx`
**Modified files:** `src/types/chain.ts`, `src/lib/chainRunner.ts`, `src/components/chain/ArrowConfigPanel.tsx`

---

### Task 2.1 — Extend `ChainEdge` type (`src/types/chain.ts`)

- [ ] Add `sourceType` discriminator to `ChainEdge`:
  ```ts
  export type ChainEdgeSourceType = 'jsonpath' | 'header' | 'regex' | 'js'

  export type ChainEdge = {
    // ... existing fields
    sourceType: ChainEdgeSourceType   // default: 'jsonpath'
    sourceHeaderName?: string         // used when sourceType === 'header'
    sourceRegex?: string              // used when sourceType === 'regex', group 1 is captured
    sourceJsSnippet?: string          // used when sourceType === 'js'
  }
  ```
- [ ] Add a `CHAIN_EDGE_SOURCE_TYPE_LABELS` constant mapping each type to a display label

---

### Task 2.2 — Update extraction logic in `chainRunner.ts`

- [ ] Refactor `extractJsonPath` to `extractValue(response: ResponseData, edge: ChainEdge): string | null`:
  - `'jsonpath'`: existing `jsonpath-plus` logic on `response.body`
  - `'header'`: find `response.headers` entry matching `edge.sourceHeaderName` (case-insensitive); return value or `null`
  - `'regex'`: apply `new RegExp(edge.sourceRegex)` against `response.body`; return capture group 1 or `null`; wrap in try/catch for invalid regex
  - `'js'`: evaluate `edge.sourceJsSnippet` using `new Function('response', snippet)(response)`; return string result or `null`; wrap in try/catch; reject non-string returns
- [ ] Replace all call sites of the old `extractJsonPath` with `extractValue`
- [ ] For `'js'` type: run inside a timeout guard — if the function throws or returns within 500ms use result, otherwise mark extraction as failed and log a structured warning

---

### Task 2.3 — Build `JsSnippetEditor` component (`src/components/chain/JsSnippetEditor.tsx`)

- [ ] Small CodeMirror 6 editor (reuse existing CodeMirror setup in the project); JavaScript language mode
- [ ] Props: `{ value: string; onChange: (v: string) => void }`
- [ ] Fixed height ~120px; line numbers on; no line wrapping
- [ ] Pre-fill placeholder snippet:
  ```js
  // response: { status, headers, body }
  return response.headers['x-auth-token']
  ```
- [ ] Wrap in a labeled section with a muted caption: `"Function receives a 'response' object. Return a string."`

---

### Task 2.4 — Update `ArrowConfigPanel` extraction UI

- [ ] Replace the single "Source JSONPath" field with a source type selector:
  - shadcn `SegmentedControl` or `Tabs` with four options: `JSONPath | Header | Regex | JS`
  - Active selection stored in local state, saved to `edge.sourceType`
- [ ] Conditional UI per source type:
  - **JSONPath**: existing path input + Epic 1 Explorer (unchanged)
  - **Header**: text input labeled "Header name" (e.g. `x-auth-token`, `Set-Cookie`)
  - **Regex**: text input labeled "Regex pattern" + a muted note: `"Capture group 1 is used as the value"`
  - **JS**: `<JsSnippetEditor>` component
- [ ] On source type change: clear previous source fields; preserve `targetField` and `targetKey`
- [ ] Validate on save: each source type has its required field filled; show inline error otherwise

---

### Task 2.5 — Manual test

- [ ] Create chain with two nodes; set source type to **Header**; run → extracted header value injected into target
- [ ] Set source type to **Regex** with pattern `"token":"(.+?)"` on a JSON body → correct capture group extracted
- [ ] Set source type to **JS** with `return response.body.split(',')[0]` → first CSV element injected
- [ ] Set source type to **JS** with a snippet that throws → node marked failed, error shown in `NodeDetailsPanel`
- [ ] Switch between source types in the panel → fields reset correctly each time
- [ ] Save edge, reopen panel → correct source type tab is active with saved value pre-filled

---

## Epic 3 — Canvas Usability Improvements

**Complexity:** Low-Medium
**New files:** `src/lib/chainLayout.ts`, `src/components/chain/NodeContextMenu.tsx`
**Modified files:** `src/components/chain/ChainCanvas.tsx`, `src/components/chain/ChainNode.tsx`

---

### Task 3.1 — Auto-Layout utility (`src/lib/chainLayout.ts`)

- [x] Import `dagre` and define:
  ```ts
  export function computeAutoLayout(
    nodes: Node[],
    edges: Edge[],
    nodeWidth = 240,
    nodeHeight = 80
  ): Record<string, { x: number; y: number }>
  ```
- [x] Create a `dagre.graphlib.Graph`; set `rankdir: 'LR'` (left-to-right) and `nodesep: 60`, `ranksep: 100`
- [x] Add each node and each edge; call `dagre.layout(g)`
- [x] Return a map of `requestId → { x, y }` using `g.node(id)` centered positions
- [x] Export a `DEFAULT_LAYOUT_OPTIONS` constant for the above defaults

---

### Task 3.2 — Auto-Layout button in `ChainCanvas`

- [x] Add an "Auto Layout" button (shadcn `Button` variant outline, `LayoutGrid` lucide icon) to the canvas toolbar
- [x] On click: call `computeAutoLayout(nodes, edges)`; call `onUpdateNodePosition` for each returned position; call `fitView()` via `useReactFlow`
- [x] Show a brief toast: `"Layout applied"` using the existing toast utility

---

### Task 3.3 — Build `NodeContextMenu` component (`src/components/chain/NodeContextMenu.tsx`)

- [x] Props:
  ```ts
  type NodeContextMenuProps = {
    x: number
    y: number
    requestId: string
    onClose: () => void
    onAddAfter: (requestId: string) => void
    onRunUpTo: (requestId: string) => void
    onRunFromHere: (requestId: string) => void
  }
  ```
- [x] Render as a fixed-position popover/menu using shadcn `DropdownMenu` content (portal-rendered)
- [x] Menu items:
  - `"Add API after this"` — fires `onAddAfter`
  - `"Run up to here"` — fires `onRunUpTo`
  - `"Run from here"` — fires `onRunFromHere`
  - Separator + `"Delete node"` — fires existing node delete handler

---

### Task 3.4 — Wire context menu into `ChainCanvas`

- [x] Add `onNodeContextMenu` handler on `<ReactFlow>`:
  - Store `{ x, y, requestId }` in local state
  - Render `<NodeContextMenu>` when state is set; clear on close or click-away
- [x] Implement `handleRunUpTo(requestId)`:
  - Determine execution order via `buildExecutionOrder`
  - Slice the order array up to and including `requestId`
  - Call `runChain` with only those nodes
- [x] Implement `handleRunFromHere(requestId)`:
  - Slice the order array from `requestId` onward
  - Reset `runState` for those nodes only; call `runChain` with that subset
- [x] Implement `handleAddAfter(requestId)`:
  - Open `ApiPickerDialog`; on pick, add new node at a position offset 320px right of current node

---

### Task 3.5 — Manual test

- [ ] Add 5+ nodes in a tangled layout → click "Auto Layout" → nodes arrange left-to-right cleanly
- [ ] Right-click node → context menu appears at cursor position
- [ ] "Run up to here" on node 3 in a 5-node chain → nodes 1–3 run; 4–5 stay idle
- [ ] "Run from here" on node 2 → nodes 2–5 run using pre-existing extracted values from node 1
- [ ] "Add API after this" → `ApiPickerDialog` opens; picked request added to canvas right of source node
- [ ] Click elsewhere → context menu closes

---

## Epic 4 — Assertions & Testing

**Complexity:** Medium
**New files:** `src/components/chain/NodeAssertionsPanel.tsx`, `src/lib/chainAssertions.ts`
**Modified files:** `src/types/chain.ts`, `src/lib/chainRunner.ts`, `src/components/chain/NodeDetailsPanel.tsx`, `src/components/chain/ChainCanvas.tsx`

---

### Task 4.1 — Define assertion types (`src/types/chain.ts`)

- [ ] Add:
  ```ts
  export type AssertionOperator =
    | 'eq' | 'neq'
    | 'contains' | 'not_contains'
    | 'gt' | 'lt'
    | 'exists' | 'not_exists'
    | 'matches_regex'

  export type ChainAssertion = {
    id: string
    source: 'status' | 'jsonpath' | 'header'
    sourcePath?: string        // JSONPath or header name
    operator: AssertionOperator
    expectedValue?: string     // not required for exists/not_exists
    enabled: boolean
  }
  ```
- [ ] Add `assertions?: ChainAssertion[]` to `ChainConfig` and `StandaloneChain` (keyed by `requestId`):
  ```ts
  nodeAssertions?: Record<string, ChainAssertion[]>
  ```
- [ ] Add assertion result to `ChainRunState` per node:
  ```ts
  assertionResults?: Array<{ assertionId: string; passed: boolean; actual: string | null }>
  ```

---

### Task 4.2 — Build assertion evaluator (`src/lib/chainAssertions.ts`)

- [ ] Implement `evaluateAssertion(assertion: ChainAssertion, response: ResponseData): { passed: boolean; actual: string | null }`:
  - Extract actual value based on `assertion.source` (status code as string, JSONPath via `jsonpath-plus`, header lookup)
  - Apply operator: `eq` (strict string equality), `contains` (substring), `gt`/`lt` (numeric), `exists` (actual !== null), `matches_regex` (RegExp test)
  - Return `{ passed, actual }`
- [ ] Implement `evaluateAllAssertions(assertions: ChainAssertion[], response: ResponseData): AssertionResult[]`
- [ ] Implement `assertionsSummary(results): { passed: number; failed: number; total: number }`

---

### Task 4.3 — Integrate assertions into `chainRunner.ts`

- [ ] Accept `nodeAssertions?: Record<string, ChainAssertion[]>` as parameter in `runChain`
- [ ] After each node completes (passed/failed by status code): run `evaluateAllAssertions` for that node's assertions
- [ ] If any assertion fails: override node state to `'failed'`; include `assertionResults` in `onUpdate` payload
- [ ] If assertion evaluation itself throws (e.g. bad regex): treat as assertion failure; log structured error

---

### Task 4.4 — Build `NodeAssertionsPanel` component (`src/components/chain/NodeAssertionsPanel.tsx`)

- [ ] Props: `{ requestId: string; assertions: ChainAssertion[]; onChange: (assertions: ChainAssertion[]) => void }`
- [ ] "Add Assertion" button → appends a new blank `ChainAssertion` with a generated `id`
- [ ] Per assertion row:
  - Source selector: `Status | JSONPath | Header` (shadcn `Select`)
  - Conditional source path input (hidden for Status)
  - Operator selector (shadcn `Select`, options filtered by source — e.g. `gt`/`lt` only shown for Status and numeric paths)
  - Expected value input (hidden for `exists`/`not_exists`)
  - Enable/disable toggle (shadcn `Switch`)
  - Delete row button (`Trash2` lucide icon)
- [ ] Rows are reorderable via drag (use existing DnD pattern if present, otherwise simple up/down arrow buttons)

---

### Task 4.5 — Wire into `NodeDetailsPanel` and `ChainCanvas`

- [ ] In `NodeDetailsPanel.tsx`: add an "Assertions" tab alongside the existing response tabs
  - Renders `<NodeAssertionsPanel>` in edit state (before run) and assertion results (after run)
  - After run: each assertion row shows a green ✓ or red ✗ badge + actual value received
- [ ] In `ChainCanvas.tsx` / page: pass `nodeAssertions` from config into `runChain`; persist assertion edits via store `upsertNodeAssertions` action (add to stores)
- [ ] In `useChainStore` / `useStandaloneChainStore`: add `upsertNodeAssertions(collectionId, requestId, assertions)` and `deleteNodeAssertions(collectionId, requestId)` actions

---

### Task 4.6 — Manual test

- [ ] Add assertion: status == 200 → run request that returns 200 → assertion passes (green ✓)
- [ ] Add assertion: JSONPath `$.data.id` exists → run → passes when field present
- [ ] Add assertion: status == 200 on a node that returns 500 → node marked as failed; downstream skipped
- [ ] Add failing assertion on node 2 in a 3-node chain → node 3 skipped; failure reason shown
- [ ] Disable assertion via toggle → it is skipped during run (not evaluated)
- [ ] Open assertions panel after run → each row shows actual value received

---

## Epic 5 — Control Flow Nodes (Logic Nodes)

**Complexity:** High (architectural change)
**New files:** `src/components/chain/DelayNode.tsx`, `src/components/chain/ConditionNode.tsx`, `src/components/chain/ConditionConfigPanel.tsx`, `src/lib/chainControlFlow.ts`
**Modified files:** `src/types/chain.ts`, `src/lib/chainRunner.ts`, `src/components/chain/ChainCanvas.tsx`, `src/components/chain/ApiPickerDialog.tsx`

---

### Task 5.1 — Extend type system (`src/types/chain.ts`)

- [ ] Add a node type discriminator:
  ```ts
  export type ChainNodeType = 'api' | 'delay' | 'condition'

  export type DelayNodeConfig = {
    id: string
    type: 'delay'
    delayMs: number             // e.g. 2000
    position: { x: number; y: number }
  }

  export type ConditionBranch = {
    id: string
    label: string               // e.g. "admin", "else"
    expression: string          // e.g. "{{role}} == 'admin'"
  }

  export type ConditionNodeConfig = {
    id: string
    type: 'condition'
    variable: string            // the variable to evaluate, e.g. "{{role}}"
    branches: ConditionBranch[]
    position: { x: number; y: number }
  }
  ```
- [ ] Add `delayNodes?: DelayNodeConfig[]` and `conditionNodes?: ConditionNodeConfig[]` to `ChainConfig` and `StandaloneChain`
- [ ] Add `'delay' | 'condition'` to `ChainNodeState` consumers (state machine remains the same)

---

### Task 5.2 — Build `DelayNode` component (`src/components/chain/DelayNode.tsx`)

- [ ] React Flow custom node; uses xFlow `Handle` for source/target connections
- [ ] Displays: clock icon + `"Wait {delayMs}ms"` label
- [ ] Inline editable: clicking the ms value opens a small input to change the delay
- [ ] During run: shows animated countdown or spinning clock icon in `running` state
- [ ] Same state-based border colors as `ChainNode`

---

### Task 5.3 — Build `ConditionNode` and `ConditionConfigPanel`

- [ ] `ConditionNode.tsx`: React Flow custom node
  - Displays: branch icon + variable name (e.g. `{{role}}`)
  - Multiple source handles — one per branch, labeled with branch label
  - Target handle on left side
  - `failed` state: red border + "No branch matched" label
- [ ] `ConditionConfigPanel.tsx`: shadcn Sheet
  - Variable input (e.g. `{{role}}`)
  - Branch list: each row has a label input + expression input (e.g. `== 'admin'`)
  - "Add Branch" button; one branch reserved as "else" (always matches, no expression)
  - Delete branch button per row (minimum 1 branch required)
  - Save / Cancel / Delete node buttons

---

### Task 5.4 — Control flow execution (`src/lib/chainControlFlow.ts`)

- [ ] Implement `resolveDelay(node: DelayNodeConfig): Promise<void>`:
  - Returns `new Promise(resolve => setTimeout(resolve, node.delayMs))`
  - Respects `AbortSignal`: reject if signal is aborted during wait
- [ ] Implement `evaluateCondition(node: ConditionNodeConfig, runState: ChainRunState): string | null`:
  - Resolves `{{var}}` tokens from `runState` extracted values
  - Evaluates each branch expression in order; returns first matching `branch.id`
  - Always returns the `else` branch id if no other matches
  - Returns `null` only if no branches configured
- [ ] Export `CONTROL_FLOW_NODE_TYPES` constant: `['delay', 'condition']`

---

### Task 5.5 — Integrate into `chainRunner.ts`

- [ ] `buildExecutionOrder`: treat delay and condition nodes as regular nodes in the topology (they have in-edges and out-edges)
- [ ] In `runChain` execution loop, detect node type:
  - `'delay'`: call `resolveDelay()`; mark passed after delay elapses
  - `'condition'`: call `evaluateCondition()`; mark the winning branch as active; mark all downstream nodes on losing branches as `'skipped'`; mark passed if a branch matched, failed otherwise
  - `'api'`: existing logic (unchanged)

---

### Task 5.6 — Wire into `ChainCanvas` and `ApiPickerDialog`

- [ ] Register `DelayNode` and `ConditionNode` as custom node types in `<ReactFlow nodeTypes={...}>`
- [ ] In canvas toolbar: add "Add Delay" and "Add Condition" buttons (or include in `NodeContextMenu`)
- [ ] Edge connecting from a condition node should carry a `branchId`; render branch label on the edge
- [ ] `ConditionConfigPanel` opens when a condition node is double-clicked or via context menu "Configure"
- [ ] Persist delay and condition nodes in stores: add `upsertDelayNode`, `upsertConditionNode`, `removeDelayNode`, `removeConditionNode` actions to both chain stores

---

### Task 5.7 — Manual test

- [ ] Add a Delay node between two API nodes → chain pauses for configured ms before second node runs
- [ ] Add a Condition node: `{{role}}` with branches `== 'admin'` and `else` → connect different APIs to each branch; run chain where extracted role is `admin` → correct branch executes
- [ ] `else` branch fires when no other branch matches
- [ ] Abort chain during delay → delay resolves immediately as skipped
- [ ] Condition node with no matching branch and no `else` → node fails; downstream skipped

---

## Epic 6 — Environment Variable Integration

**Complexity:** Medium
**New files:** `src/components/chain/PromoteToEnvPopover.tsx`
**Modified files:** `src/types/chain.ts`, `src/lib/chainRunner.ts`, `src/components/chain/NodeDetailsPanel.tsx`, `src/components/chain/ArrowConfigPanel.tsx`, `src/stores/useChainStore.ts`, `src/stores/useStandaloneChainStore.ts`

---

### Task 6.1 — Extend types (`src/types/chain.ts`)

- [ ] Add per-node extraction-to-env mapping:
  ```ts
  export type EnvPromotion = {
    edgeId: string          // which edge's extracted value to promote
    envId: string           // target environment id
    envVarName: string      // key to write into the environment
  }

  // Add to ChainConfig / StandaloneChain:
  envPromotions?: EnvPromotion[]
  ```

---

### Task 6.2 — Build `PromoteToEnvPopover` component (`src/components/chain/PromoteToEnvPopover.tsx`)

- [ ] Props:
  ```ts
  type PromoteToEnvPopoverProps = {
    edgeId: string
    extractedValue: string | null
    existingPromotion?: EnvPromotion
    onSave: (promotion: EnvPromotion) => void
    onRemove: (edgeId: string) => void
  }
  ```
- [ ] Trigger: a small `"→ ENV"` badge/button rendered in the "Extracted Values" section of `NodeDetailsPanel`
- [ ] shadcn `Popover` content:
  - Environment selector (shadcn `Select`, populated from `environmentsStore`)
  - Variable name input with auto-suggested name from `jsonPathToVarName(edge.sourceJsonPath)`
  - "Save" button; "Remove promotion" link if one exists
- [ ] If no environments exist: show a note `"Create an environment first"` with a link

---

### Task 6.3 — Write extracted values to environment on run

- [ ] In `chainRunner.ts` `runChain`: accept `envPromotions?: EnvPromotion[]` parameter
- [ ] After each node's extraction succeeds, check if any `EnvPromotion` matches the `edgeId`
- [ ] If match found: call a provided `onPromoteToEnv(envId, varName, value)` callback
- [ ] In the page (`src/app/chain/[collectionId]/page.tsx`): implement the callback to call `environmentsStore.setVariable(envId, varName, value)` (or equivalent update action)
- [ ] The written value is a runtime update only — it does not permanently overwrite the saved env; add a `"runtime"` flag or source tag if the env store supports it, so users can distinguish auto-written values

---

### Task 6.4 — Update store actions

- [ ] In `useChainStore` and `useStandaloneChainStore`: add:
  - `upsertEnvPromotion(collectionId, promotion: EnvPromotion)`
  - `deleteEnvPromotion(collectionId, edgeId: string)`
- [ ] Persist `envPromotions` array in the existing IndexedDB structure alongside `edges`

---

### Task 6.5 — Update `ArrowConfigPanel` with promotion indicator

- [ ] In `ArrowConfigPanel`, show a small `"→ ENV"` badge next to the Save button if an `EnvPromotion` already exists for this edge
- [ ] Tooltip on badge: `"Extracted value will be written to {{varName}} in {envName}"`

---

### Task 6.6 — Manual test

- [ ] Run chain with 10 nodes where node 1 extracts `$.token`; promote it to env var `auth_token` in env `Dev`
- [ ] After run: open `Dev` environment → `auth_token` is populated with extracted value
- [ ] In nodes 5 and 8 (no direct edge from node 1): use `{{auth_token}}` in their URL/headers → values correctly resolved during run via env injection
- [ ] Remove promotion → variable is no longer written on next run
- [ ] Edge case: extraction fails on node 1 → `auth_token` is not written; downstream `{{auth_token}}` resolves to empty string (not crash)
- [ ] Two promotions from two different edges to same env var → last-written wins; no crash

---
