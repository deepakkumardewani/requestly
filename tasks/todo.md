# Build queue — Transform playground autocomplete

## Task 1: Path indexing utility

**Dependencies:** None

**Test targets:** `src/lib/jsonStructurePaths.spec.ts` — full branch coverage for pure logic (`buildJsonPathSuggestions`, `extractTopLevelKeysFromJsonLikeText`, `buildJsonPathSuggestionsFromText`).

- [x] Impl
- [x] Test

## Task 2: CodeEditor — optional structure completion source

**Dependencies:** Task 1

**Test targets:** `src/lib/structureCompletion.spec.ts` — pure helpers (`shouldSuppressStructureCompletion`, `buildStructurePathCompletionOptions`).

- [x] Impl
- [x] Test

## Task 3: Fix dynamic placeholder remount

**Dependencies:** Task 2

**Test targets:** `src/lib/codeMirrorPlaceholderCompartment.spec.ts` — documents Compartment reconfigure pattern (placeholder updates without new EditorView).

- [x] Impl
- [x] Test

## Task 4: Wire TransformPage

**Dependencies:** Tasks 1–3

**Test targets:** `src/lib/structureCompletion.spec.ts` — `getStructureCompletionRange` (JS vs JSONPath prefix extraction).

- [x] Impl
- [x] Test
