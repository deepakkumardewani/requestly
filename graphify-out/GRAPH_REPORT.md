# Graph Report - requestly  (2026-05-01)

## Corpus Check
- 227 files · ~436,268 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 731 nodes · 759 edges · 34 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]

## God Nodes (most connected - your core abstractions)
1. `generateId()` - 17 edges
2. `getDB()` - 15 edges
3. `generateSnippet()` - 10 edges
4. `buildFinalUrl()` - 10 edges
5. `runChain()` - 10 edges
6. `buildHeadersObject()` - 9 edges
7. `buildBodyString()` - 9 edges
8. `GET()` - 8 edges
9. `isRecord()` - 8 edges
10. `buildRequestFromOperation()` - 8 edges

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
Nodes (17): handleDuplicate(), historyEntryToChainNode(), addVariable(), handleEnvFile(), useImportedHubSlugs(), handleImport(), parseDotEnvContent(), getImportedSlugs() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (21): GET(), evaluateAllAssertions(), evaluateAssertion(), extractActualValue(), buildVarValues(), evaluateCondition(), resolveDelay(), testExpression() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (16): importFromShareQuery(), getAnonUserId(), base64ToUint8(), decryptPayload(), encryptPayload(), requireSubtle(), uint8ToBase64(), createShareLink() (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (16): getDB(), persistConfig(), deleteCollectionFromDB(), deleteRequestFromDB(), persistCollection(), persistRequest(), deleteEnvFromDB(), persistEnv() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (13): HistoryItem(), buildUrlWithParams(), cn(), parsePathParams(), parseQueryString(), syncParamsFromUrl(), truncateUrl(), handlePathRowsChange() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (16): buildBodyString(), buildHeadersObject(), capitalize(), generateAxios(), generateCSharp(), generateFetch(), generateGo(), generateJava() (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (12): handleClose(), handleCurlImport(), handleOpenApiPasteImport(), importFileData(), importOpenApiText(), importPostmanCollection(), importPostmanItems(), parsePostmanAuth() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (11): handleFormatLeft(), handleFormatRight(), accumulateStats(), buildPath(), diffJson(), diffValues(), formatJson(), isPlainObject() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (17): buildRequestFromOperation(), isProbablyOpenApiDoc(), isRecord(), joinUrl(), jsonStringifyExample(), mergeParams(), normalizeParameters(), openApi3BaseUrl() (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.27
Nodes (11): addSortIndicators(), enableUI(), getNthColumn(), getTable(), getTableBody(), getTableHeader(), loadColumns(), loadData() (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.27
Nodes (9): autoReplaceUrlSegment(), handleSave(), handleSelectJsonPath(), handleTargetFieldChange(), handleTargetKeyChange(), jsonPathToVarName(), resolveJsonPathFromParsed(), stripRowIds() (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.2
Nodes (8): handleCurlImport(), CurlParseError, isHttpMethod(), isJsonString(), joinContinuations(), parseCurl(), parseHeader(), tokenize()

### Community 12 - "Community 12"
Cohesion: 0.35
Nodes (8): a(), B(), D(), g(), i(), k(), Q(), y()

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (5): buildAllNodes(), buildApiNodes(), buildConditionNodes(), buildDelayNodes(), buildDisplayNodes()

### Community 15 - "Community 15"
Cohesion: 0.31
Nodes (5): handleAdd(), handleOperatorChange(), handleSourceChange(), makeBlankAssertion(), update()

### Community 16 - "Community 16"
Cohesion: 0.25
Nodes (4): commitDraft(), handleDraftKeyBlur(), rowMasked(), isSensitiveHeaderKey()

### Community 17 - "Community 17"
Cohesion: 0.39
Nodes (7): buildBody(), buildHeaders(), executeProxy(), parseGraphQLVariables(), runGraphQLRequest(), runRequest(), parseTimingHeaders()

### Community 18 - "Community 18"
Cohesion: 0.42
Nodes (7): execute(), makeConsoleInterceptor(), makeEnvAPI(), makeRequestAPI(), makeResponseAPI(), runPostScript(), runPreScript()

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (2): BreadcrumbLink(), cn()

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (3): getShortcuts(), isMac(), modKey()

### Community 21 - "Community 21"
Cohesion: 0.43
Nodes (5): applySelection(), getEnvPrefix(), handleChange(), handleKeyDown(), updateSuggestions()

### Community 22 - "Community 22"
Cohesion: 0.47
Nodes (4): computeHealthMetrics(), healthKey(), normaliseUrl(), percentile()

### Community 23 - "Community 23"
Cohesion: 0.53
Nodes (4): buildJsonPathSuggestions(), buildJsonPathSuggestionsFromText(), extractTopLevelKeysFromJsonLikeText(), sortPathsShallowFirst()

### Community 24 - "Community 24"
Cohesion: 0.7
Nodes (4): goToNext(), goToPrevious(), makeCurrent(), toggleClass()

### Community 30 - "Community 30"
Cohesion: 0.5
Nodes (2): cn(), formatPrimitivePreview()

### Community 31 - "Community 31"
Cohesion: 0.4
Nodes (1): ErrorBoundary

### Community 33 - "Community 33"
Cohesion: 0.4
Nodes (2): resolveVariables(), ConnectButton()

### Community 34 - "Community 34"
Cohesion: 0.6
Nodes (3): estimateHttpTabRequestBytes(), estimateKvHeadersBytes(), estimateRequestBodyBytes()

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (2): commitEdit(), handleKeyDown()

### Community 43 - "Community 43"
Cohesion: 0.5
Nodes (2): useEnvVariableKeys(), ScriptEditor()

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (2): getModifierKeys(), ShortcutRow()

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (2): getModifierKeys(), ShortcutRow()

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (2): handleSelect(), resolvePathFromParsed()

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (2): getStatusClasses(), StatusBadge()

## Knowledge Gaps
- **Thin community `Community 19`** (7 nodes): `breadcrumb.tsx`, `Breadcrumb()`, `BreadcrumbEllipsis()`, `BreadcrumbLink()`, `BreadcrumbPage()`, `BreadcrumbSeparator()`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (5 nodes): `buildPath()`, `cn()`, `formatPrimitivePreview()`, `getPrimitiveColor()`, `JsonPathExplorer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (5 nodes): `ErrorBoundary`, `.componentDidCatch()`, `.getDerivedStateFromError()`, `.render()`, `ErrorBoundary.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (5 nodes): `resolveVariables()`, `tokenizeVariables()`, `ConnectButton()`, `ConnectButton.tsx`, `variableResolver.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (4 nodes): `commitEdit()`, `handleKeyDown()`, `StateIcon()`, `DelayNode.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (4 nodes): `useEnvVariableKeys()`, `ScriptEditor()`, `ScriptEditor.tsx`, `useEnvVariableKeys.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (3 nodes): `getModifierKeys()`, `ShortcutRow()`, `ShortcutsSection.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (3 nodes): `getModifierKeys()`, `ShortcutRow()`, `KeyboardShortcutsModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (3 nodes): `handleSelect()`, `resolvePathFromParsed()`, `ValuePickerPopover.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (3 nodes): `getStatusClasses()`, `StatusBadge()`, `StatusBadge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateId()` connect `Community 0` to `Community 3`, `Community 4`, `Community 6`, `Community 8`, `Community 10`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `importFileData()` connect `Community 6` to `Community 0`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `parseInsomnia()` connect `Community 6` to `Community 1`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `generateId()` (e.g. with `appendWsLog()` and `createEmptyTab()`) actually correct?**
  _`generateId()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `getDB()` (e.g. with `persistChain()` and `deleteChainFromDB()`) actually correct?**
  _`getDB()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `generateSnippet()` (e.g. with `generateCurl()` and `generateFetch()`) actually correct?**
  _`generateSnippet()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `buildFinalUrl()` (e.g. with `generateFetch()` and `generateAxios()`) actually correct?**
  _`buildFinalUrl()` has 9 INFERRED edges - model-reasoned connections that need verification._