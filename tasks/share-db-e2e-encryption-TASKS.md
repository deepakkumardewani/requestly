# Implementation Plan: DB-backed Share Links with E2E Encryption

## Overview

Replace the current base64 URL-based share system with short opaque IDs backed by Upstash Redis. Payloads are AES-GCM-256 encrypted client-side before upload — the server only ever stores ciphertext. The decryption key travels exclusively in the URL fragment (`#key`), which browsers never send to servers.

Old `?r=` logic is deleted entirely. No migration, no backward compat.

## Architecture Decisions

- **Upstash Redis** over a relational DB: key-value is the natural model for share payloads; Redis INCR gives rate limiting for free; Vercel Marketplace integration means zero-config env vars.
- **AES-GCM-256 via Web Crypto API**: browser-native, no extra dependency, the standard for this pattern.
- **Key in URL fragment**: fragments are stripped by browsers before sending HTTP requests — the server provably cannot log or store the key.
- **nanoid(8)** for share IDs: 8 chars = ~47 bits of entropy, collision-safe at hobby scale.
- **localStorage for anon user ID**: simple, persistent per-device, sufficient for rate limiting. No IndexedDB complexity needed.

---

## Task List

### Phase 1: Infrastructure

- [ ] **Task 1: Install dependencies and configure Upstash Redis**
- [ ] **Task 2: Create `src/lib/anonUser.ts`**
- [ ] **Task 3: Create `src/lib/crypto.ts` — AES-GCM encrypt/decrypt helpers**

### Checkpoint: Foundation
- [ ] `bun run build` passes with no type errors
- [ ] Redis client connects (verify in Upstash dashboard after Task 1)

### Phase 2: API Routes

- [x] **Task 4: Create `POST /api/share` route**
- [x] **Task 5: Create `GET /api/share/[id]` route**

### Checkpoint: API
- [x] POST returns `{ id }` for valid input
- [x] GET returns `{ ciphertext, iv }` for known ID
- [x] GET returns 404 for unknown ID
- [x] 21st POST from same userId within 1hr returns 429

### Phase 3: Frontend Wiring

- [ ] **Task 6: Rewrite `src/lib/shareLink.ts`**
- [ ] **Task 7: Update `ShareModal.tsx` — async link creation**
- [ ] **Task 8: Update `MainLayout.tsx` — replace `?r=` with `?s=` import**

### Checkpoint: End-to-end
- [ ] Full flow works: share → copy URL → open in new tab → auto-imports request
- [ ] Upstash dashboard shows ciphertext, not plaintext
- [ ] Missing fragment → graceful error, no crash
- [ ] Old `?r=` URLs → silently ignored (no crash)

---

## Detailed Tasks

---

### Task 1: Install dependencies and configure Upstash Redis

**Description:** Install `@upstash/redis` and `nanoid`. Create the Redis client singleton. Env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) come from Vercel Marketplace — add them to `.env.local` for local dev after connecting in Vercel dashboard.

**Acceptance criteria:**
- [ ] `bun add @upstash/redis nanoid` runs cleanly
- [ ] `src/lib/redis.ts` exports a singleton `Redis` client using env vars
- [ ] `.env.local.example` (or similar) documents the two required env var names

**Files:**
- `src/lib/redis.ts` (new)
- `package.json` / `bun.lockb`

**Estimated scope:** S

---

### Task 2: Create `src/lib/anonUser.ts`

**Description:** Thin utility that reads `rq_anon_id` from `localStorage`. If absent, generates a `crypto.randomUUID()`, persists it, and returns it. Guards against SSR by checking `typeof window`.

**Acceptance criteria:**
- [ ] `getAnonUserId()` returns the same string across multiple calls in the same browser
- [ ] Returns a new UUID on a fresh browser / cleared localStorage
- [ ] Does not throw in SSR context (returns `""` or short-circuits)

**Files:**
- `src/lib/anonUser.ts` (new)

**Estimated scope:** XS

---

### Task 3: Create `src/lib/crypto.ts` — AES-GCM helpers

**Description:** Two pure async functions using the Web Crypto API:
- `encryptPayload(plaintext: string): Promise<{ ciphertext: string; iv: string; keyB64: string }>` — generates key + IV, encrypts, returns all three as base64 strings.
- `decryptPayload(ciphertext: string, iv: string, keyB64: string): Promise<string>` — imports key, decrypts, returns plaintext string.

Both use AES-GCM 256-bit. IV is 12 random bytes (GCM standard). Throws on failure (callers handle errors).

**Acceptance criteria:**
- [ ] `encryptPayload` → `decryptPayload` round-trip returns original string
- [ ] Different calls to `encryptPayload` with same input produce different ciphertext (random IV)
- [ ] `decryptPayload` throws on wrong key or corrupted ciphertext

**Files:**
- `src/lib/crypto.ts` (new)

**Estimated scope:** S

---

### Task 4: Create `POST /api/share` route

**Description:** Accepts `{ ciphertext, iv, userId }`. Rate-limits via Redis INCR (key: `ratelimit:{userId}`, TTL 3600s, max 20). Generates `nanoid(8)` ID. Stores `{ ciphertext, iv }` under `share:{id}`. Returns `{ id }`.

**Acceptance criteria:**
- [ ] Returns `{ id }` (8-char string) on valid input
- [ ] Returns `429` when userId exceeds 20 shares in 1hr
- [ ] Returns `400` on missing/invalid body fields
- [ ] Stored Redis value is ciphertext only — no plaintext, no key

**Files:**
- `src/app/api/share/route.ts` (new)

**Estimated scope:** S

---

### Task 5: Create `GET /api/share/[id]` route

**Description:** Reads `share:{id}` from Redis. Returns `{ ciphertext, iv }` on hit, `404` on miss.

**Acceptance criteria:**
- [ ] Returns `{ ciphertext, iv }` for a known ID
- [ ] Returns `404` JSON for unknown ID (not a server error)
- [ ] Does not return anything beyond `ciphertext` and `iv`

**Files:**
- `src/app/api/share/[id]/route.ts` (new)

**Estimated scope:** XS

---

### Task 6: Rewrite `src/lib/shareLink.ts`

**Description:** Delete `encodeShareLink`, `decodeShareLink`, and all base64/Zod schema logic. Replace with:

- `createShareLink(tab: HttpTab, userId: string): Promise<string | null>` — builds `SharePayload` from tab, calls `encryptPayload`, POSTs to `/api/share`, returns `${origin}/?s=${id}#${keyB64}`. Returns `null` on any error.
- `fetchSharePayload(id: string): Promise<SharePayload | null>` — reads `window.location.hash` for the key, GETs `/api/share/${id}`, decrypts, parses + validates with `ShareRequestSchema`. Returns `null` on any failure.

`ShareRequestSchema` and `SharePayload` type stay (still needed for validation on import).

**Acceptance criteria:**
- [ ] `createShareLink` returns a URL matching `/?s=\w{8}#[A-Za-z0-9+/=]+`
- [ ] `fetchSharePayload` called with matching ID + fragment returns original payload
- [ ] Both return `null` rather than throwing on errors

**Files:**
- `src/lib/shareLink.ts` (rewrite)
- `src/lib/crypto.ts` (imported)
- `src/lib/anonUser.ts` (imported by callers, not directly here)

**Estimated scope:** M

---

### Task 7: Update `ShareModal.tsx` — async link creation

**Description:** Replace the synchronous `encodeShareLink(tab)` call with `createShareLink(tab, getAnonUserId())`. Add a loading state (`isCreating`) while the async call runs — show a spinner or disable the copy button. Show an error message if `createShareLink` returns `null`. Everything else (copy-to-clipboard, "What's included" section, warnings) stays the same.

**Acceptance criteria:**
- [ ] Copy button is disabled / shows loading indicator while link is being created
- [ ] Successful creation populates the link input and enables copy
- [ ] `null` result shows a user-visible error ("Failed to create share link")
- [ ] No references to `encodeShareLink` remain

**Files:**
- `src/components/request/ShareModal.tsx`

**Estimated scope:** S

---

### Task 8: Update `MainLayout.tsx` — replace `?r=` with `?s=` import

**Description:** Delete the entire `?r=` / `decodeShareLink` block. Add a new `useEffect` that:
1. Reads `new URLSearchParams(window.location.search).get("s")`
2. If present, calls `fetchSharePayload(id)` (which reads `window.location.hash` internally)
3. On success, calls `openTab(payload)` to auto-import
4. Clears both `?s=` and `#fragment` via `history.replaceState` after import (success or failure)
5. On failure (null result), shows a toast or silent ignore — no crash

**Acceptance criteria:**
- [ ] Opening `/?s={id}#{key}` auto-imports the request
- [ ] URL is cleaned (`?s=` and `#key` removed) after processing
- [ ] Missing fragment or invalid ID does not crash the app
- [ ] No `?r=` or `decodeShareLink` references remain anywhere in the codebase

**Files:**
- `src/components/layout/MainLayout.tsx`

**Estimated scope:** S

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Upstash free tier exhausted | Medium | 10k cmds/day is ~5k shares/day — fine for hobby; monitor dashboard |
| User loses URL with fragment | High (by design) | Warn in ShareModal: "This link cannot be recovered if lost" |
| SSR access to `localStorage` / `crypto.subtle` | Medium | Guard with `typeof window !== "undefined"` in `anonUser.ts` and `shareLink.ts` |
| `history.replaceState` strips fragment before decrypt completes | Medium | Decrypt first, then call `replaceState` in the same tick after |

## Open Questions

- Should the ShareModal warn the user that the link is unrecoverable (no way to re-generate the same link)? → Recommend yes, one line of copy.
