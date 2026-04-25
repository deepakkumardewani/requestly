import { z } from "zod";
import {
  SHARE_RATE_LIMIT_MAX,
  SHARE_RATE_LIMIT_TTL_SEC,
} from "@/lib/shareServer";

/** `localStorage` key; exported for tests / debugging. */
export const SHARE_RATE_LOCAL_STORAGE_KEY = "rq_share_rl_v1";

const LocalStateSchema = z.object({
  c: z.number().int().nonnegative(),
  w: z.number(),
});

type LocalState = z.infer<typeof LocalStateSchema>;

const WINDOW_MS = SHARE_RATE_LIMIT_TTL_SEC * 1_000;

function readState(): LocalState | null {
  if (globalThis.localStorage === undefined) {
    return null;
  }
  try {
    const raw = globalThis.localStorage.getItem(SHARE_RATE_LOCAL_STORAGE_KEY);
    if (raw == null) {
      return null;
    }
    const j: unknown = JSON.parse(raw);
    const r = LocalStateSchema.safeParse(j);
    if (!r.success) {
      globalThis.localStorage.removeItem(SHARE_RATE_LOCAL_STORAGE_KEY);
      return null;
    }
    return r.data;
  } catch (e) {
    console.warn("[requestly] share rate localStorage read failed", e);
    return null;
  }
}

function writeState(s: LocalState): void {
  if (globalThis.localStorage === undefined) {
    return;
  }
  try {
    globalThis.localStorage.setItem(
      SHARE_RATE_LOCAL_STORAGE_KEY,
      JSON.stringify(s),
    );
  } catch (e) {
    console.warn("[requestly] share rate localStorage write failed", e);
  }
}

/**
 * If local state says the user is at the per-window cap, we skip the share API
 * (no Redis on this request). If storage is empty/corrupt/cleared, returns
 * `blocked: false` and the next share attempt falls through to the server.
 */
export function getLocalShareRateBlock():
  | { blocked: false }
  | { blocked: true; resetAtMs: number } {
  const st = readState();
  if (st === null) {
    return { blocked: false };
  }
  const now = Date.now();
  if (now - st.w >= WINDOW_MS) {
    if (globalThis.localStorage !== undefined) {
      try {
        globalThis.localStorage.removeItem(SHARE_RATE_LOCAL_STORAGE_KEY);
      } catch {
        /* empty */
      }
    }
    return { blocked: false };
  }
  if (st.c >= SHARE_RATE_LIMIT_MAX) {
    return { blocked: true, resetAtMs: st.w + WINDOW_MS };
  }
  return { blocked: false };
}

/**
 * Call after a successful `POST /api/share` (HTTP 2xx with an id) from this
 * device so the local counter matches expected usage before the next share.
 */
export function recordLocalShareSuccess(): void {
  const st = readState();
  const now = Date.now();
  if (st === null || now - st.w >= WINDOW_MS) {
    writeState({ c: 1, w: now });
    return;
  }
  writeState({ c: st.c + 1, w: st.w });
}

/**
 * Align local state with a server 429 (e.g. user cleared storage but Redis
 * still has the count) so the next share attempt is blocked without another
 * request when possible.
 */
export function alignLocalStateWithServerRateLimit(
  serverResetAtMs?: number,
): void {
  const w =
    serverResetAtMs != null && Number.isFinite(serverResetAtMs)
      ? Math.max(0, serverResetAtMs - WINDOW_MS)
      : Date.now();
  writeState({ c: SHARE_RATE_LIMIT_MAX, w });
}
