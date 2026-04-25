const ANON_ID_STORAGE_KEY = "rq_anon_id";

/**
 * Returns a stable anonymous user id for rate limiting (localStorage) or
 * `""` when not in a browser or when storage is unavailable.
 */
export function getAnonUserId(): string {
  const win = globalThis.window;
  if (win === undefined) {
    return "";
  }
  try {
    const existing = win.localStorage.getItem(ANON_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const id = globalThis.crypto.randomUUID();
    win.localStorage.setItem(ANON_ID_STORAGE_KEY, id);
    return id;
  } catch (e) {
    console.warn("[requestly] getAnonUserId: localStorage unavailable", e);
    return "";
  }
}
