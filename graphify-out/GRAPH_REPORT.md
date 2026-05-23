# Graph Report - requestly  (2026-05-23)

## Corpus Check
- 384 files · ~522,370 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1159 nodes · 1133 edges · 51 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 155 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 108|Community 108]]

## God Nodes (most connected - your core abstractions)
1. `success()` - 22 edges
2. `getDB()` - 17 edges
3. `generateId()` - 16 edges
4. `scanFileContent()` - 11 edges
5. `generateSnippet()` - 10 edges
6. `buildFinalUrl()` - 10 edges
7. `runChain()` - 10 edges
8. `getDeepseek()` - 9 edges
9. `buildHeadersObject()` - 9 edges
10. `buildBodyString()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `createEmptyTab()` --calls--> `generateId()`  [INFERRED]
  src/stores/useTabsStore.ts → src/lib/utils.ts
- `handleCopy()` --calls--> `success()`  [INFERRED]
  src/components/request/ShareModal.tsx → src/lib/importScanner.ts
- `handleDuplicate()` --calls--> `generateId()`  [INFERRED]
  src/components/collections/RequestItem.tsx → src/lib/utils.ts
- `scanFileContent()` --calls--> `isInsomniaExport()`  [INFERRED]
  src/lib/importScanner.ts → src/lib/insomniaParser.ts
- `handleClearHistory()` --calls--> `success()`  [INFERRED]
  src/app/settings/SettingsPageClient.tsx → src/lib/importScanner.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (35): handleSave(), handleCurlImport(), importPostmanCollection(), CurlParseError, isHttpMethod(), isJsonString(), joinContinuations(), parseCurl() (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (20): commitName(), handleAddEnvironment(), handleConfirmDelete(), commit(), HistoryItem(), Tab(), buildUrlWithParams(), cn() (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (19): historyEntryToChainNode(), useImportedHubSlugs(), handleImport(), getImportedSlugs(), importHubEntry(), mapHubBodyType(), mapHubEnvironment(), mapHubKVPairs() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (24): GET(), evaluateAllAssertions(), evaluateAssertion(), extractActualValue(), buildVarValues(), evaluateCondition(), resolveDelay(), testExpression() (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (18): getDB(), persistConfig(), deleteCollectionFromDB(), deleteFolderFromDB(), deleteRequestFromDB(), persistCollection(), persistFolder(), persistRequest() (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (17): importFromShareQuery(), getAnonUserId(), base64ToUint8(), decryptPayload(), encryptPayload(), requireSubtle(), uint8ToBase64(), createShareLink() (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (12): handleFormatLeft(), handleFormatRight(), applyRowHighlights(), clearRowHighlights(), handleFormatJson(), accumulateStats(), buildPath(), diffJson() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.26
Nodes (16): handleCopyAsCurl(), buildBodyString(), buildHeadersObject(), capitalize(), generateAxios(), generateCSharp(), generateFetch(), generateGo() (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (17): buildRequestFromOperation(), isProbablyOpenApiDoc(), isRecord(), joinUrl(), jsonStringifyExample(), mergeParams(), normalizeParameters(), openApi3BaseUrl() (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.24
Nodes (10): handleSelectJsonPath(), handleTargetFieldChange(), handleTargetKeyChange(), handleSelectJsonPath(), handleTargetFieldChange(), handleTargetKeyChange(), updateActive(), autoReplaceUrlSegment() (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.2
Nodes (10): handleDuplicate(), handleExportPostman(), buildPostmanAuth(), buildPostmanBody(), buildPostmanItems(), buildPostmanUrl(), downloadPostmanCollection(), downloadPostmanRequest() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.27
Nodes (11): addSortIndicators(), enableUI(), getNthColumn(), getTable(), getTableBody(), getTableHeader(), loadColumns(), loadData() (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (8): handleClose(), handleImport(), handleScan(), queueFile(), resetInputState(), runScan(), MockFileReader, handleFileUpload()

### Community 13 - "Community 13"
Cohesion: 0.24
Nodes (7): fetchGraphQLSchema(), argPlaceholder(), buildArgsString(), buildFieldSnippet(), buildSubfieldLines(), getNamedTypeName(), handleFetchSchema()

### Community 14 - "Community 14"
Cohesion: 0.35
Nodes (8): a(), B(), D(), g(), i(), k(), Q(), y()

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (9): getDeepseek(), handleBuildRequest(), handleExplainError(), handleGenerateBody(), handleSuggestAssertions(), handleSuggestHeaders(), handleSuggestJsonpath(), handleSummarizeResponse() (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (5): buildAllNodes(), buildApiNodes(), buildConditionNodes(), buildDelayNodes(), buildDisplayNodes()

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (4): commitDraft(), handleDraftKeyBlur(), rowMasked(), isSensitiveHeaderKey()

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (1): MockWebSocket

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (2): ErrorBoundary, renderOpenMenu()

### Community 21 - "Community 21"
Cohesion: 0.36
Nodes (6): handleExportCSV(), handleExportJSON(), buildExportFilename(), downloadFile(), exportHistoryAsCSV(), exportHistoryAsJSON()

### Community 22 - "Community 22"
Cohesion: 0.42
Nodes (7): execute(), makeConsoleInterceptor(), makeEnvAPI(), makeRequestAPI(), makeResponseAPI(), runPostScript(), runPreScript()

### Community 23 - "Community 23"
Cohesion: 0.28
Nodes (5): parseFormDataFromContent(), resolveFormDataRows(), handleCloseAI(), handleGenerate(), handleTypeChange()

### Community 24 - "Community 24"
Cohesion: 0.39
Nodes (7): buildBody(), buildHeaders(), executeProxy(), parseGraphQLVariables(), runGraphQLRequest(), runRequest(), parseTimingHeaders()

### Community 26 - "Community 26"
Cohesion: 0.36
Nodes (5): handleAdd(), handleOperatorChange(), handleSourceChange(), makeBlankAssertion(), update()

### Community 27 - "Community 27"
Cohesion: 0.32
Nodes (4): checkSyntax(), handleCheckSyntax(), handleCloseAI(), handleGenerate()

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (2): BreadcrumbLink(), cn()

### Community 30 - "Community 30"
Cohesion: 0.43
Nodes (5): applySelection(), getEnvPrefix(), handleChange(), handleKeyDown(), updateSuggestions()

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (2): FolderExpandProvider(), useFolderExpandState()

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (3): getShortcuts(), isMac(), modKey()

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (2): useThemeAccent(), ThemeAccentApplier()

### Community 37 - "Community 37"
Cohesion: 0.4
Nodes (2): hist(), httpTab()

### Community 38 - "Community 38"
Cohesion: 0.47
Nodes (4): computeHealthMetrics(), healthKey(), normaliseUrl(), percentile()

### Community 39 - "Community 39"
Cohesion: 0.53
Nodes (4): buildJsonPathSuggestions(), buildJsonPathSuggestionsFromText(), extractTopLevelKeysFromJsonLikeText(), sortPathsShallowFirst()

### Community 40 - "Community 40"
Cohesion: 0.7
Nodes (4): goToNext(), goToPrevious(), makeCurrent(), toggleClass()

### Community 48 - "Community 48"
Cohesion: 0.5
Nodes (2): commitEdit(), handleKeyDown()

### Community 49 - "Community 49"
Cohesion: 0.5
Nodes (2): cn(), formatPrimitivePreview()

### Community 50 - "Community 50"
Cohesion: 0.7
Nodes (4): commitTimeout(), handleFollowRedirectsChange(), handleSslChange(), patch()

### Community 53 - "Community 53"
Cohesion: 0.6
Nodes (3): estimateHttpTabRequestBytes(), estimateKvHeadersBytes(), estimateRequestBodyBytes()

### Community 54 - "Community 54"
Cohesion: 0.4
Nodes (2): resolveVariables(), ConnectButton()

### Community 57 - "Community 57"
Cohesion: 0.83
Nodes (3): baseHttpTab(), baseResponse(), createHistoryEntry()

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (2): getModifierKeys(), ShortcutRow()

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (2): getModifierKeys(), ShortcutRow()

### Community 87 - "Community 87"
Cohesion: 1.0
Nodes (2): handleSelect(), resolvePathFromParsed()

### Community 88 - "Community 88"
Cohesion: 1.0
Nodes (2): getStatusClasses(), StatusBadge()

### Community 89 - "Community 89"
Cohesion: 1.0
Nodes (2): httpTab(), makeEntry()

### Community 90 - "Community 90"
Cohesion: 1.0
Nodes (2): entry(), httpTab()

### Community 98 - "Community 98"
Cohesion: 1.0
Nodes (2): entry(), httpTab()

### Community 105 - "Community 105"
Cohesion: 1.0
Nodes (2): baseTab(), pair()

### Community 106 - "Community 106"
Cohesion: 1.0
Nodes (2): makeEntry(), minimalResponse()

### Community 108 - "Community 108"
Cohesion: 1.0
Nodes (2): consumeDotEnvBulkPaste(), parseDotEnvContent()

## Knowledge Gaps
- **Thin community `Community 19`** (9 nodes): `useConnectionStore.spec.ts`, `makeIoSocket()`, `MockWebSocket`, `.close()`, `.constructor()`, `.send()`, `openSocketIoTab()`, `openWsTab()`, `openWsTabEmpty()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (9 nodes): `ErrorBoundary`, `.componentDidCatch()`, `.getDerivedStateFromError()`, `.render()`, `renderOpenMenu()`, `resetStores()`, `seedHttpTab()`, `ErrorBoundary.tsx`, `TabContextMenu.spec.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (7 nodes): `breadcrumb.tsx`, `Breadcrumb()`, `BreadcrumbEllipsis()`, `BreadcrumbLink()`, `BreadcrumbPage()`, `BreadcrumbSeparator()`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (7 nodes): `FolderExpandProvider()`, `useFolderExpand()`, `readCollapsed()`, `useFolderExpandState()`, `writeCollapsed()`, `FolderExpandContext.tsx`, `useFolderExpandState.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (6 nodes): `useThemeAccent()`, `AppProviders()`, `CronitorTracker()`, `ThemeAccentApplier()`, `useThemeAccent.ts`, `AppProviders.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (6 nodes): `disconnect()`, `hist()`, `httpTab()`, `observe()`, `unobserve()`, `CommandPalette.spec.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (5 nodes): `cn()`, `commitEdit()`, `handleKeyDown()`, `StateIcon()`, `DelayNode.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (5 nodes): `buildPath()`, `cn()`, `formatPrimitivePreview()`, `getPrimitiveColor()`, `JsonPathExplorer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (5 nodes): `resolveVariables()`, `tokenizeVariables()`, `ConnectButton()`, `ConnectButton.tsx`, `variableResolver.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (3 nodes): `getModifierKeys()`, `ShortcutRow()`, `ShortcutsSection.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (3 nodes): `getModifierKeys()`, `ShortcutRow()`, `KeyboardShortcutsModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (3 nodes): `handleSelect()`, `resolvePathFromParsed()`, `ValuePickerPopover.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (3 nodes): `getStatusClasses()`, `StatusBadge()`, `StatusBadge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (3 nodes): `httpTab()`, `makeEntry()`, `HistoryList.spec.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (3 nodes): `entry()`, `httpTab()`, `HistoryItem.spec.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (3 nodes): `entry()`, `httpTab()`, `HealthDot.spec.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 105`** (3 nodes): `baseTab()`, `pair()`, `codeGenerators.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (3 nodes): `makeEntry()`, `minimalResponse()`, `healthMonitor.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (3 nodes): `consumeDotEnvBulkPaste()`, `parseDotEnvContent()`, `dotenvImport.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `success()` connect `Community 0` to `Community 1`, `Community 2`, `Community 5`, `Community 7`, `Community 12`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `generateId()` connect `Community 2` to `Community 0`, `Community 1`, `Community 4`, `Community 8`, `Community 10`, `Community 12`, `Community 18`, `Community 26`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `scanFileContent()` connect `Community 0` to `Community 8`, `Community 3`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `success()` (e.g. with `handleClearHistory()` and `handleCurlImport()`) actually correct?**
  _`success()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `getDB()` (e.g. with `persistChain()` and `deleteChainFromDB()`) actually correct?**
  _`getDB()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `generateId()` (e.g. with `appendWsLog()` and `createEmptyTab()`) actually correct?**
  _`generateId()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `scanFileContent()` (e.g. with `isInsomniaExport()` and `parseInsomnia()`) actually correct?**
  _`scanFileContent()` has 6 INFERRED edges - model-reasoned connections that need verification._