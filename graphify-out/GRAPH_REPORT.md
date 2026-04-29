# Graph Report - requestly  (2026-04-29)

## Corpus Check
- 326 files · ~469,091 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 916 nodes · 815 edges · 39 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]

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
  src/stores/useTabsStore.ts → src/lib/utils.ts
- `POST()` --calls--> `GET()`  [INFERRED]
  src/app/api/proxy/route.ts → src/app/api/share/[id]/route.ts
- `GET()` --calls--> `parseStoredShareRecord()`  [INFERRED]
  src/app/api/share/[id]/route.ts → src/lib/shareServer.ts
- `GET()` --calls--> `parseInsomnia()`  [INFERRED]
  src/app/api/share/[id]/route.ts → src/lib/insomniaParser.ts
- `handleCurlImport()` --calls--> `parseCurl()`  [INFERRED]
  src/app/import/page.tsx → src/lib/curlParser.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (17): handleDuplicate(), commitDraft(), handleDraftKeyBlur(), historyEntryToChainNode(), addVariable(), useImportedHubSlugs(), handleImport(), getImportedSlugs() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (23): GET(), evaluateAllAssertions(), evaluateAssertion(), extractActualValue(), buildVarValues(), evaluateCondition(), resolveDelay(), testExpression() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (16): importFromShareQuery(), getAnonUserId(), base64ToUint8(), decryptPayload(), encryptPayload(), requireSubtle(), uint8ToBase64(), createShareLink() (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (16): getDB(), persistConfig(), deleteCollectionFromDB(), deleteRequestFromDB(), persistCollection(), persistRequest(), deleteEnvFromDB(), persistEnv() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (13): HistoryItem(), buildUrlWithParams(), cn(), parsePathParams(), parseQueryString(), syncParamsFromUrl(), truncateUrl(), handlePathRowsChange() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (16): buildBodyString(), buildHeadersObject(), capitalize(), generateAxios(), generateCSharp(), generateFetch(), generateGo(), generateJava() (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (11): handleFormatLeft(), handleFormatRight(), accumulateStats(), buildPath(), diffJson(), diffValues(), formatJson(), isPlainObject() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (10): MockFileReader, handleCurlImport(), handleFileUpload(), CurlParseError, isHttpMethod(), isJsonString(), joinContinuations(), parseCurl() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.27
Nodes (11): addSortIndicators(), enableUI(), getNthColumn(), getTable(), getTableBody(), getTableHeader(), loadColumns(), loadData() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.27
Nodes (9): autoReplaceUrlSegment(), handleSave(), handleSelectJsonPath(), handleTargetFieldChange(), handleTargetKeyChange(), jsonPathToVarName(), resolveJsonPathFromParsed(), stripRowIds() (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.35
Nodes (8): a(), B(), D(), g(), i(), k(), Q(), y()

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (5): buildAllNodes(), buildApiNodes(), buildConditionNodes(), buildDelayNodes(), buildDisplayNodes()

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (1): MockWebSocket

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (2): ErrorBoundary, renderOpenMenu()

### Community 15 - "Community 15"
Cohesion: 0.31
Nodes (5): handleAdd(), handleOperatorChange(), handleSourceChange(), makeBlankAssertion(), update()

### Community 16 - "Community 16"
Cohesion: 0.42
Nodes (7): execute(), makeConsoleInterceptor(), makeEnvAPI(), makeRequestAPI(), makeResponseAPI(), runPostScript(), runPreScript()

### Community 17 - "Community 17"
Cohesion: 0.39
Nodes (7): buildBody(), buildHeaders(), executeProxy(), parseGraphQLVariables(), runGraphQLRequest(), runRequest(), parseTimingHeaders()

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (2): BreadcrumbLink(), cn()

### Community 19 - "Community 19"
Cohesion: 0.43
Nodes (5): applySelection(), getEnvPrefix(), handleChange(), handleKeyDown(), updateSuggestions()

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (3): getShortcuts(), isMac(), modKey()

### Community 23 - "Community 23"
Cohesion: 0.4
Nodes (2): hist(), httpTab()

### Community 24 - "Community 24"
Cohesion: 0.47
Nodes (4): computeHealthMetrics(), healthKey(), normaliseUrl(), percentile()

### Community 25 - "Community 25"
Cohesion: 0.53
Nodes (4): buildJsonPathSuggestions(), buildJsonPathSuggestionsFromText(), extractTopLevelKeysFromJsonLikeText(), sortPathsShallowFirst()

### Community 26 - "Community 26"
Cohesion: 0.7
Nodes (4): goToNext(), goToPrevious(), makeCurrent(), toggleClass()

### Community 33 - "Community 33"
Cohesion: 0.5
Nodes (2): cn(), formatPrimitivePreview()

### Community 35 - "Community 35"
Cohesion: 0.4
Nodes (2): resolveVariables(), ConnectButton()

### Community 38 - "Community 38"
Cohesion: 0.6
Nodes (3): estimateHttpTabRequestBytes(), estimateKvHeadersBytes(), estimateRequestBodyBytes()

### Community 42 - "Community 42"
Cohesion: 0.83
Nodes (3): baseHttpTab(), baseResponse(), createHistoryEntry()

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (2): commitEdit(), handleKeyDown()

### Community 56 - "Community 56"
Cohesion: 0.5
Nodes (2): useEnvVariableKeys(), ScriptEditor()

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (2): getModifierKeys(), ShortcutRow()

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (2): getModifierKeys(), ShortcutRow()

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (2): handleSelect(), resolvePathFromParsed()

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (2): getStatusClasses(), StatusBadge()

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (2): httpTab(), makeEntry()

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (2): entry(), httpTab()

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (2): entry(), httpTab()

### Community 89 - "Community 89"
Cohesion: 1.0
Nodes (2): baseTab(), pair()

### Community 90 - "Community 90"
Cohesion: 1.0
Nodes (2): makeEntry(), minimalResponse()

## Knowledge Gaps
- **Thin community `Community 13`** (9 nodes): `useConnectionStore.spec.ts`, `makeIoSocket()`, `MockWebSocket`, `.close()`, `.constructor()`, `.send()`, `openSocketIoTab()`, `openWsTab()`, `openWsTabEmpty()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (9 nodes): `ErrorBoundary`, `.componentDidCatch()`, `.getDerivedStateFromError()`, `.render()`, `renderOpenMenu()`, `resetStores()`, `seedHttpTab()`, `ErrorBoundary.tsx`, `TabContextMenu.spec.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (7 nodes): `breadcrumb.tsx`, `Breadcrumb()`, `BreadcrumbEllipsis()`, `BreadcrumbLink()`, `BreadcrumbPage()`, `BreadcrumbSeparator()`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (6 nodes): `disconnect()`, `hist()`, `httpTab()`, `observe()`, `unobserve()`, `CommandPalette.spec.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (5 nodes): `buildPath()`, `cn()`, `formatPrimitivePreview()`, `getPrimitiveColor()`, `JsonPathExplorer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (5 nodes): `resolveVariables()`, `tokenizeVariables()`, `ConnectButton()`, `ConnectButton.tsx`, `variableResolver.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (4 nodes): `commitEdit()`, `handleKeyDown()`, `StateIcon()`, `DelayNode.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (4 nodes): `useEnvVariableKeys()`, `ScriptEditor()`, `ScriptEditor.tsx`, `useEnvVariableKeys.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (3 nodes): `getModifierKeys()`, `ShortcutRow()`, `ShortcutsSection.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (3 nodes): `getModifierKeys()`, `ShortcutRow()`, `KeyboardShortcutsModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (3 nodes): `handleSelect()`, `resolvePathFromParsed()`, `ValuePickerPopover.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (3 nodes): `getStatusClasses()`, `StatusBadge()`, `StatusBadge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (3 nodes): `httpTab()`, `makeEntry()`, `HistoryList.spec.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (3 nodes): `entry()`, `httpTab()`, `HistoryItem.spec.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (3 nodes): `entry()`, `httpTab()`, `HealthDot.spec.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (3 nodes): `baseTab()`, `pair()`, `codeGenerators.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (3 nodes): `makeEntry()`, `minimalResponse()`, `healthMonitor.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateId()` connect `Community 0` to `Community 9`, `Community 3`, `Community 4`, `Community 15`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `createEmptyTab()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
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