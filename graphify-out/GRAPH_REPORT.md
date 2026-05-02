# Graph Report - requestly  (2026-05-02)

## Corpus Check
- 231 files · ~441,789 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 761 nodes · 796 edges · 38 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 99 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 74|Community 74]]

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
- `GET()` --calls--> `buildExecutionOrder()`  [INFERRED]
  src/app/api/share/[id]/route.ts → src/lib/chainRunner.ts
- `GET()` --calls--> `runChain()`  [INFERRED]
  src/app/api/share/[id]/route.ts → src/lib/chainRunner.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (18): handleDuplicate(), historyEntryToChainNode(), useImportedHubSlugs(), handleImport(), getImportedSlugs(), importHubEntry(), mapHubBodyType(), mapHubEnvironment() (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (16): getDB(), persistConfig(), deleteCollectionFromDB(), deleteRequestFromDB(), persistCollection(), persistRequest(), deleteEnvFromDB(), persistEnv() (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (13): HistoryItem(), buildUrlWithParams(), cn(), parsePathParams(), parseQueryString(), syncParamsFromUrl(), truncateUrl(), handlePathRowsChange() (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (16): importFromShareQuery(), getAnonUserId(), base64ToUint8(), decryptPayload(), encryptPayload(), requireSubtle(), uint8ToBase64(), createShareLink() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (19): evaluateAllAssertions(), evaluateAssertion(), extractActualValue(), buildVarValues(), evaluateCondition(), resolveDelay(), testExpression(), applyInjection() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (16): buildBodyString(), buildHeadersObject(), capitalize(), generateAxios(), generateCSharp(), generateFetch(), generateGo(), generateJava() (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (12): handleClose(), handleCurlImport(), handleOpenApiPasteImport(), importFileData(), importOpenApiText(), importPostmanCollection(), importPostmanItems(), parsePostmanAuth() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.24
Nodes (17): buildRequestFromOperation(), isProbablyOpenApiDoc(), isRecord(), joinUrl(), jsonStringifyExample(), mergeParams(), normalizeParameters(), openApi3BaseUrl() (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.27
Nodes (11): addSortIndicators(), enableUI(), getNthColumn(), getTable(), getTableBody(), getTableHeader(), loadColumns(), loadData() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.27
Nodes (9): autoReplaceUrlSegment(), handleSave(), handleSelectJsonPath(), handleTargetFieldChange(), handleTargetKeyChange(), jsonPathToVarName(), resolveJsonPathFromParsed(), stripRowIds() (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.2
Nodes (8): handleCurlImport(), CurlParseError, isHttpMethod(), isJsonString(), joinContinuations(), parseCurl(), parseHeader(), tokenize()

### Community 11 - "Community 11"
Cohesion: 0.24
Nodes (9): GET(), enforceShareRateLimit(), getRateLimitResetAtMs(), parseIntFromRedisGet(), parseStoredShareRecord(), rateLimitKeyForUser(), shareStorageKey(), POST() (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.26
Nodes (9): handleFormatLeft(), handleFormatRight(), accumulateStats(), buildPath(), diffJson(), diffValues(), formatJson(), isPlainObject() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.35
Nodes (8): a(), B(), D(), g(), i(), k(), Q(), y()

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (5): buildAllNodes(), buildApiNodes(), buildConditionNodes(), buildDelayNodes(), buildDisplayNodes()

### Community 16 - "Community 16"
Cohesion: 0.31
Nodes (5): handleAdd(), handleOperatorChange(), handleSourceChange(), makeBlankAssertion(), update()

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (4): commitDraft(), handleDraftKeyBlur(), rowMasked(), isSensitiveHeaderKey()

### Community 18 - "Community 18"
Cohesion: 0.36
Nodes (6): handleExportCSV(), handleExportJSON(), buildExportFilename(), downloadFile(), exportHistoryAsCSV(), exportHistoryAsJSON()

### Community 19 - "Community 19"
Cohesion: 0.42
Nodes (7): execute(), makeConsoleInterceptor(), makeEnvAPI(), makeRequestAPI(), makeResponseAPI(), runPostScript(), runPreScript()

### Community 20 - "Community 20"
Cohesion: 0.25
Nodes (2): fetchGraphQLSchema(), handleFetchSchema()

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (2): BreadcrumbLink(), cn()

### Community 22 - "Community 22"
Cohesion: 0.43
Nodes (5): applySelection(), getEnvPrefix(), handleChange(), handleKeyDown(), updateSuggestions()

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (3): getShortcuts(), isMac(), modKey()

### Community 26 - "Community 26"
Cohesion: 0.47
Nodes (4): computeHealthMetrics(), healthKey(), normaliseUrl(), percentile()

### Community 27 - "Community 27"
Cohesion: 0.53
Nodes (4): buildJsonPathSuggestions(), buildJsonPathSuggestionsFromText(), extractTopLevelKeysFromJsonLikeText(), sortPathsShallowFirst()

### Community 28 - "Community 28"
Cohesion: 0.7
Nodes (4): goToNext(), goToPrevious(), makeCurrent(), toggleClass()

### Community 34 - "Community 34"
Cohesion: 0.5
Nodes (2): cn(), formatPrimitivePreview()

### Community 35 - "Community 35"
Cohesion: 0.4
Nodes (1): ErrorBoundary

### Community 37 - "Community 37"
Cohesion: 0.7
Nodes (4): commitTimeout(), handleFollowRedirectsChange(), handleSslChange(), patch()

### Community 38 - "Community 38"
Cohesion: 0.6
Nodes (3): estimateHttpTabRequestBytes(), estimateKvHeadersBytes(), estimateRequestBodyBytes()

### Community 39 - "Community 39"
Cohesion: 0.4
Nodes (2): resolveVariables(), ConnectButton()

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (2): commitEdit(), handleKeyDown()

### Community 48 - "Community 48"
Cohesion: 0.5
Nodes (2): useEnvVariableKeys(), ScriptEditor()

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (2): getModifierKeys(), ShortcutRow()

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (2): getModifierKeys(), ShortcutRow()

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (2): handleSelect(), resolvePathFromParsed()

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (2): getStatusClasses(), StatusBadge()

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (2): consumeDotEnvBulkPaste(), parseDotEnvContent()

## Knowledge Gaps
- **Thin community `Community 20`** (8 nodes): `fetchGraphQLSchema()`, `formatTypeRef()`, `buildSections()`, `FieldRow()`, `getOtherTypes()`, `handleFetchSchema()`, `GraphQLSchemaExplorer.tsx`, `graphqlIntrospection.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (7 nodes): `breadcrumb.tsx`, `Breadcrumb()`, `BreadcrumbEllipsis()`, `BreadcrumbLink()`, `BreadcrumbPage()`, `BreadcrumbSeparator()`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (5 nodes): `buildPath()`, `cn()`, `formatPrimitivePreview()`, `getPrimitiveColor()`, `JsonPathExplorer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (5 nodes): `ErrorBoundary`, `.componentDidCatch()`, `.getDerivedStateFromError()`, `.render()`, `ErrorBoundary.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (5 nodes): `resolveVariables()`, `tokenizeVariables()`, `ConnectButton()`, `ConnectButton.tsx`, `variableResolver.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (4 nodes): `commitEdit()`, `handleKeyDown()`, `StateIcon()`, `DelayNode.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (4 nodes): `useEnvVariableKeys()`, `ScriptEditor()`, `ScriptEditor.tsx`, `useEnvVariableKeys.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (3 nodes): `getModifierKeys()`, `ShortcutRow()`, `ShortcutsSection.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (3 nodes): `getModifierKeys()`, `ShortcutRow()`, `KeyboardShortcutsModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (3 nodes): `handleSelect()`, `resolvePathFromParsed()`, `ValuePickerPopover.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (3 nodes): `getStatusClasses()`, `StatusBadge()`, `StatusBadge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (3 nodes): `consumeDotEnvBulkPaste()`, `parseDotEnvContent()`, `dotenvImport.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateId()` connect `Community 0` to `Community 1`, `Community 2`, `Community 6`, `Community 7`, `Community 9`, `Community 16`, `Community 17`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `importFileData()` connect `Community 6` to `Community 0`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `parseInsomnia()` connect `Community 6` to `Community 11`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `generateId()` (e.g. with `appendWsLog()` and `createEmptyTab()`) actually correct?**
  _`generateId()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `getDB()` (e.g. with `persistChain()` and `deleteChainFromDB()`) actually correct?**
  _`getDB()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `generateSnippet()` (e.g. with `generateCurl()` and `generateFetch()`) actually correct?**
  _`generateSnippet()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `buildFinalUrl()` (e.g. with `generateFetch()` and `generateAxios()`) actually correct?**
  _`buildFinalUrl()` has 9 INFERRED edges - model-reasoned connections that need verification._