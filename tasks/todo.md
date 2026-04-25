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

## Share DB E2E encryption — Phase 1: Infrastructure

### Share-1: Install dependencies and configure Upstash Redis

**Dependencies:** None

**Test targets:** `src/lib/redis.spec.ts` — ensure singleton exports with stubbed env (no network).

- [x] Impl
- [x] Test

### Share-2: `src/lib/anonUser.ts`

**Dependencies:** Share-1 done (soft — none for code, ordering only)

**Test targets:** `src/lib/anonUser.spec.ts` — SSR guard, idempotence, new UUID on empty storage.

- [x] Impl
- [x] Test

### Share-3: `src/lib/crypto.ts`

**Dependencies:** None

**Test targets:** `src/lib/crypto.spec.ts` — round-trip, non-deterministic encrypt, decrypt failure cases.

- [x] Impl
- [x] Test

## Share DB E2E encryption — Phase 2: API routes

### Share-4: `POST /api/share`

**Dependencies:** Share-1–3 (infrastructure / Redis, crypto context)

**Test targets:** `src/lib/shareServer.spec.ts` — `SharePostBodySchema`, `enforceShareRateLimit`, `shareStorageKey`, `rateLimitKeyForUser`

- [x] Impl
- [x] Test

### Share-5: `GET /api/share/[id]`

**Dependencies:** Share-4

**Test targets:** `src/lib/shareServer.spec.ts` — `parseStoredShareRecord` (and `ShareStoredRecordSchema` via round-trip)

- [x] Impl
- [x] Test

## Task 4: Wire TransformPage

**Dependencies:** Tasks 1–3

**Test targets:** `src/lib/structureCompletion.spec.ts` — `getStructureCompletionRange` (JS vs JSONPath prefix extraction).

- [x] Impl
- [x] Test
