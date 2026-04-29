# Graph Report - src/  (2026-04-29)

## Corpus Check
- Large corpus: 213 files · ~81,936 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 654 nodes · 632 edges · 28 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Collections & Request Items|Collections & Request Items]]
- [[_COMMUNITY_API Routes & Sharing|API Routes & Sharing]]
- [[_COMMUNITY_Layout & Navigation|Layout & Navigation]]
- [[_COMMUNITY_IndexedDB Persistence|IndexedDB Persistence]]
- [[_COMMUNITY_Request & Chain UI|Request & Chain UI]]
- [[_COMMUNITY_Code Generation & cURL|Code Generation & cURL]]
- [[_COMMUNITY_Response & JSON Compare|Response & JSON Compare]]
- [[_COMMUNITY_Chain Arrow Config|Chain Arrow Config]]
- [[_COMMUNITY_Import & File Handling|Import & File Handling]]
- [[_COMMUNITY_Chain Canvas Rendering|Chain Canvas Rendering]]
- [[_COMMUNITY_Node Assertions Panel|Node Assertions Panel]]
- [[_COMMUNITY_Script Runner|Script Runner]]
- [[_COMMUNITY_Request Execution Engine|Request Execution Engine]]
- [[_COMMUNITY_Breadcrumb UI|Breadcrumb UI]]
- [[_COMMUNITY_Env Autocomplete Input|Env Autocomplete Input]]
- [[_COMMUNITY_Empty State & Shortcuts|Empty State & Shortcuts]]
- [[_COMMUNITY_Health Monitor|Health Monitor]]
- [[_COMMUNITY_JSON Structure Paths|JSON Structure Paths]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]

## God Nodes (most connected - your core abstractions)
1. `getDB()` - 15 edges
2. `generateId()` - 13 edges
3. `generateSnippet()` - 10 edges
4. `buildFinalUrl()` - 10 edges
5. `runChain()` - 10 edges
6. `buildHeadersObject()` - 9 edges
7. `buildBodyString()` - 9 edges
8. `GET()` - 8 edges
9. `createShareLink()` - 7 edges
10. `parseCurl()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `createEmptyTab()` --calls--> `generateId()`  [INFERRED]
  stores/useTabsStore.ts → lib/utils.ts
- `GET()` --calls--> `parseStoredShareRecord()`  [INFERRED]
  app/api/share/[id]/route.ts → lib/shareServer.ts
- `parseInsomnia()` --calls--> `GET()`  [INFERRED]
  lib/insomniaParser.ts → app/api/share/[id]/route.ts
- `handleCurlImport()` --calls--> `parseCurl()`  [INFERRED]
  app/import/page.tsx → lib/curlParser.ts
- `appendWsLog()` --calls--> `generateId()`  [INFERRED]
  stores/useConnectionStore.ts → lib/utils.ts

## Communities

### Community 0 - "Collections & Request Items"
Cohesion: 0.06
Nodes (17): handleDuplicate(), commitDraft(), handleDraftKeyBlur(), historyEntryToChainNode(), addVariable(), useImportedHubSlugs(), handleImport(), getImportedSlugs() (+9 more)

### Community 1 - "API Routes & Sharing"
Cohesion: 0.07
Nodes (23): GET(), evaluateAllAssertions(), evaluateAssertion(), extractActualValue(), buildVarValues(), evaluateCondition(), resolveDelay(), testExpression() (+15 more)

### Community 2 - "Layout & Navigation"
Cohesion: 0.11
Nodes (16): importFromShareQuery(), getAnonUserId(), base64ToUint8(), decryptPayload(), encryptPayload(), requireSubtle(), uint8ToBase64(), createShareLink() (+8 more)

### Community 3 - "IndexedDB Persistence"
Cohesion: 0.09
Nodes (16): getDB(), persistConfig(), deleteCollectionFromDB(), deleteRequestFromDB(), persistCollection(), persistRequest(), deleteEnvFromDB(), persistEnv() (+8 more)

### Community 4 - "Request & Chain UI"
Cohesion: 0.1
Nodes (13): HistoryItem(), buildUrlWithParams(), cn(), parsePathParams(), parseQueryString(), syncParamsFromUrl(), truncateUrl(), handlePathRowsChange() (+5 more)

### Community 5 - "Code Generation & cURL"
Cohesion: 0.24
Nodes (16): buildBodyString(), buildHeadersObject(), capitalize(), generateAxios(), generateCSharp(), generateFetch(), generateGo(), generateJava() (+8 more)

### Community 6 - "Response & JSON Compare"
Cohesion: 0.14
Nodes (11): handleFormatLeft(), handleFormatRight(), accumulateStats(), buildPath(), diffJson(), diffValues(), formatJson(), isPlainObject() (+3 more)

### Community 7 - "Chain Arrow Config"
Cohesion: 0.27
Nodes (9): autoReplaceUrlSegment(), handleSave(), handleSelectJsonPath(), handleTargetFieldChange(), handleTargetKeyChange(), jsonPathToVarName(), resolveJsonPathFromParsed(), stripRowIds() (+1 more)

### Community 8 - "Import & File Handling"
Cohesion: 0.2
Nodes (8): handleCurlImport(), CurlParseError, isHttpMethod(), isJsonString(), joinContinuations(), parseCurl(), parseHeader(), tokenize()

### Community 10 - "Chain Canvas Rendering"
Cohesion: 0.29
Nodes (5): buildAllNodes(), buildApiNodes(), buildConditionNodes(), buildDelayNodes(), buildDisplayNodes()

### Community 11 - "Node Assertions Panel"
Cohesion: 0.31
Nodes (5): handleAdd(), handleOperatorChange(), handleSourceChange(), makeBlankAssertion(), update()

### Community 12 - "Script Runner"
Cohesion: 0.42
Nodes (7): execute(), makeConsoleInterceptor(), makeEnvAPI(), makeRequestAPI(), makeResponseAPI(), runPostScript(), runPreScript()

### Community 13 - "Request Execution Engine"
Cohesion: 0.39
Nodes (7): buildBody(), buildHeaders(), executeProxy(), parseGraphQLVariables(), runGraphQLRequest(), runRequest(), parseTimingHeaders()

### Community 14 - "Breadcrumb UI"
Cohesion: 0.33
Nodes (2): BreadcrumbLink(), cn()

### Community 15 - "Env Autocomplete Input"
Cohesion: 0.43
Nodes (5): applySelection(), getEnvPrefix(), handleChange(), handleKeyDown(), updateSuggestions()

### Community 16 - "Empty State & Shortcuts"
Cohesion: 0.33
Nodes (3): getShortcuts(), isMac(), modKey()

### Community 17 - "Health Monitor"
Cohesion: 0.47
Nodes (4): computeHealthMetrics(), healthKey(), normaliseUrl(), percentile()

### Community 18 - "JSON Structure Paths"
Cohesion: 0.53
Nodes (4): buildJsonPathSuggestions(), buildJsonPathSuggestionsFromText(), extractTopLevelKeysFromJsonLikeText(), sortPathsShallowFirst()

### Community 24 - "Community 24"
Cohesion: 0.5
Nodes (2): cn(), formatPrimitivePreview()

### Community 25 - "Community 25"
Cohesion: 0.4
Nodes (1): ErrorBoundary

### Community 27 - "Community 27"
Cohesion: 0.6
Nodes (3): estimateHttpTabRequestBytes(), estimateKvHeadersBytes(), estimateRequestBodyBytes()

### Community 28 - "Community 28"
Cohesion: 0.4
Nodes (2): resolveVariables(), ConnectButton()

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (2): commitEdit(), handleKeyDown()

### Community 39 - "Community 39"
Cohesion: 0.5
Nodes (2): useEnvVariableKeys(), ScriptEditor()

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (2): getModifierKeys(), ShortcutRow()

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (2): getModifierKeys(), ShortcutRow()

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (2): handleSelect(), resolvePathFromParsed()

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (2): getStatusClasses(), StatusBadge()

## Knowledge Gaps
- **Thin community `Breadcrumb UI`** (7 nodes): `breadcrumb.tsx`, `Breadcrumb()`, `BreadcrumbEllipsis()`, `BreadcrumbLink()`, `BreadcrumbPage()`, `BreadcrumbSeparator()`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (5 nodes): `JsonPathExplorer.tsx`, `buildPath()`, `cn()`, `formatPrimitivePreview()`, `getPrimitiveColor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (5 nodes): `ErrorBoundary`, `.componentDidCatch()`, `.getDerivedStateFromError()`, `.render()`, `ErrorBoundary.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (5 nodes): `ConnectButton.tsx`, `resolveVariables()`, `tokenizeVariables()`, `variableResolver.ts`, `ConnectButton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (4 nodes): `DelayNode.tsx`, `commitEdit()`, `handleKeyDown()`, `StateIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (4 nodes): `ScriptEditor.tsx`, `useEnvVariableKeys.ts`, `useEnvVariableKeys()`, `ScriptEditor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (3 nodes): `ShortcutsSection.tsx`, `getModifierKeys()`, `ShortcutRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (3 nodes): `KeyboardShortcutsModal.tsx`, `getModifierKeys()`, `ShortcutRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (3 nodes): `ValuePickerPopover.tsx`, `handleSelect()`, `resolvePathFromParsed()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (3 nodes): `getStatusClasses()`, `StatusBadge()`, `StatusBadge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateId()` connect `Community 0` to `Community 11`, `Community 3`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `createEmptyTab()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `getDB()` (e.g. with `persistChain()` and `deleteChainFromDB()`) actually correct?**
  _`getDB()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `generateId()` (e.g. with `appendWsLog()` and `createEmptyTab()`) actually correct?**
  _`generateId()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `generateSnippet()` (e.g. with `generateCurl()` and `generateFetch()`) actually correct?**
  _`generateSnippet()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `buildFinalUrl()` (e.g. with `generateFetch()` and `generateAxios()`) actually correct?**
  _`buildFinalUrl()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `runChain()` (e.g. with `GET()` and `resolveDelay()`) actually correct?**
  _`runChain()` has 6 INFERRED edges - model-reasoned connections that need verification._