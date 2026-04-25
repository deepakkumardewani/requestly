import { afterEach, describe, expect, it, vi } from "vitest";
import {
  alignLocalStateWithServerRateLimit,
  getLocalShareRateBlock,
  recordLocalShareSuccess,
  SHARE_RATE_LOCAL_STORAGE_KEY,
} from "./shareRateLimitLocal";
import { SHARE_RATE_LIMIT_MAX } from "./shareServer";

const store: Record<string, string> = {};

function mockLocalStorage() {
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  });
}

afterEach(() => {
  for (const k of Object.keys(store)) {
    delete store[k];
  }
  vi.unstubAllGlobals();
});

describe("getLocalShareRateBlock / recordLocalShareSuccess", () => {
  it("is not blocked when storage is empty", () => {
    mockLocalStorage();
    expect(getLocalShareRateBlock()).toEqual({ blocked: false });
  });

  it("blocks when count is at the cap in the current window", () => {
    mockLocalStorage();
    const t0 = 1_000_000;
    vi.setSystemTime(t0);
    for (let i = 0; i < SHARE_RATE_LIMIT_MAX; i += 1) {
      recordLocalShareSuccess();
    }
    vi.setSystemTime(t0 + 1000);
    const got = getLocalShareRateBlock();
    expect(got).toEqual({
      blocked: true,
      resetAtMs: t0 + 3_600_000,
    });
  });

  it("ignores local state when the window is expired (rolling hour)", () => {
    mockLocalStorage();
    const w = 10_000_000;
    store[SHARE_RATE_LOCAL_STORAGE_KEY] = JSON.stringify({
      c: SHARE_RATE_LIMIT_MAX,
      w,
    });
    vi.setSystemTime(w + 3_600_001);
    expect(getLocalShareRateBlock()).toEqual({ blocked: false });
  });
});

describe("alignLocalStateWithServerRateLimit", () => {
  it("sets count to the max and derives window from server resetAt", () => {
    mockLocalStorage();
    const resetAt = 20_000_000_000;
    const windowMs = 3_600_000;
    alignLocalStateWithServerRateLimit(resetAt);
    const raw = store[SHARE_RATE_LOCAL_STORAGE_KEY] as string;
    const p = JSON.parse(raw) as { c: number; w: number };
    expect(p.c).toBe(SHARE_RATE_LIMIT_MAX);
    expect(p.w).toBe(resetAt - windowMs);
  });
});

describe("recordLocalShareSuccess", () => {
  it("starts a new window on first success", () => {
    mockLocalStorage();
    vi.setSystemTime(5_000_000);
    recordLocalShareSuccess();
    const p = JSON.parse(store[SHARE_RATE_LOCAL_STORAGE_KEY] as string) as {
      c: number;
      w: number;
    };
    expect(p).toEqual({ c: 1, w: 5_000_000 });
  });
});
