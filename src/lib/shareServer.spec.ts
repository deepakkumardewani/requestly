import { afterEach, describe, expect, it, vi } from "vitest";
import {
  enforceShareRateLimit,
  getRateLimitResetAtMs,
  parseStoredShareRecord,
  rateLimitKeyForUser,
  SharePostBodySchema,
  shareStorageKey,
} from "./shareServer";

describe("shareServer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("SharePostBodySchema", () => {
    it("accepts a valid payload", () => {
      const r = SharePostBodySchema.safeParse({
        ciphertext: "YQ==",
        iv: "dGVzdGl2dmtleQ==",
        userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      });
      expect(r.success).toBe(true);
    });

    it("rejects when ciphertext is missing or empty", () => {
      expect(
        SharePostBodySchema.safeParse({
          iv: "x",
          userId: "u",
        }).success,
      ).toBe(false);
      expect(
        SharePostBodySchema.safeParse({
          ciphertext: "",
          iv: "x",
          userId: "u",
        }).success,
      ).toBe(false);
    });

    it("rejects when iv is missing or empty", () => {
      expect(
        SharePostBodySchema.safeParse({
          ciphertext: "x",
          userId: "u",
        }).success,
      ).toBe(false);
      expect(
        SharePostBodySchema.safeParse({
          ciphertext: "x",
          iv: "",
          userId: "u",
        }).success,
      ).toBe(false);
    });

    it("rejects when userId is missing or empty", () => {
      expect(
        SharePostBodySchema.safeParse({
          ciphertext: "x",
          iv: "y",
        }).success,
      ).toBe(false);
      expect(
        SharePostBodySchema.safeParse({
          ciphertext: "x",
          iv: "y",
          userId: "",
        }).success,
      ).toBe(false);
    });
  });

  describe("shareStorageKey", () => {
    it("uses share: prefix", () => {
      expect(shareStorageKey("abc12")).toBe("share:abc12");
    });
  });

  describe("rateLimitKeyForUser", () => {
    it("prefixes user id with ratelimit namespace", () => {
      expect(rateLimitKeyForUser("u-1")).toBe("ratelimit:u-1");
    });
  });

  describe("enforceShareRateLimit", () => {
    it("returns ok and sets expire on first increment", async () => {
      const get = vi.fn().mockResolvedValue(null);
      const incr = vi.fn().mockResolvedValue(1);
      const decr = vi.fn();
      const expire = vi.fn().mockResolvedValue(1);
      const out = await enforceShareRateLimit(
        { get, incr, decr, expire },
        "user-a",
      );
      expect(out).toBe("ok");
      expect(get).toHaveBeenCalledWith("ratelimit:user-a");
      expect(incr).toHaveBeenCalledWith("ratelimit:user-a");
      expect(expire).toHaveBeenCalledWith("ratelimit:user-a", 3600);
      expect(decr).not.toHaveBeenCalled();
    });

    it("does not call expire when count is not 1", async () => {
      const get = vi.fn().mockResolvedValue(null);
      const incr = vi.fn().mockResolvedValue(2);
      const decr = vi.fn();
      const expire = vi.fn();
      const out = await enforceShareRateLimit(
        { get, incr, decr, expire },
        "user-b",
      );
      expect(out).toBe("ok");
      expect(expire).not.toHaveBeenCalled();
    });

    it("returns rate_limited and decrements to undo the over-cap increment", async () => {
      const get = vi.fn().mockResolvedValue(null);
      const incr = vi.fn().mockResolvedValue(21);
      const decr = vi.fn().mockResolvedValue(20);
      const expire = vi.fn();
      const out = await enforceShareRateLimit(
        { get, incr, decr, expire },
        "user-c",
      );
      expect(out).toBe("rate_limited");
      expect(decr).toHaveBeenCalledWith("ratelimit:user-c");
    });

    it("returns ok at exactly the cap", async () => {
      const get = vi.fn().mockResolvedValue(null);
      const incr = vi.fn().mockResolvedValue(20);
      const decr = vi.fn();
      const expire = vi.fn();
      const out = await enforceShareRateLimit(
        { get, incr, decr, expire },
        "user-d",
      );
      expect(out).toBe("ok");
      expect(decr).not.toHaveBeenCalled();
    });

    it("returns rate_limited when count is already at the cap (no incr)", async () => {
      const get = vi.fn().mockResolvedValue("20");
      const incr = vi.fn();
      const decr = vi.fn();
      const expire = vi.fn();
      const out = await enforceShareRateLimit(
        { get, incr, decr, expire },
        "user-e",
      );
      expect(out).toBe("rate_limited");
      expect(incr).not.toHaveBeenCalled();
    });
  });

  describe("getRateLimitResetAtMs", () => {
    it("returns null when pttl is not positive", async () => {
      const pttl = vi.fn().mockResolvedValue(-1);
      await expect(
        getRateLimitResetAtMs(
          { pttl } as { pttl: (k: string) => Promise<number> },
          "u1",
        ),
      ).resolves.toBeNull();
    });

    it("returns now + pttl in milliseconds", async () => {
      const pttl = vi.fn().mockResolvedValue(60_000);
      const t0 = Date.now();
      const out = await getRateLimitResetAtMs(
        { pttl } as { pttl: (k: string) => Promise<number> },
        "u2",
      );
      expect(out).toBeGreaterThanOrEqual(t0 + 60_000);
      expect(out).toBeLessThanOrEqual(t0 + 60_000 + 500);
      expect(pttl).toHaveBeenCalledWith("ratelimit:u2");
    });
  });

  describe("parseStoredShareRecord", () => {
    it("returns ciphertext and iv from a JSON string", () => {
      const rec = parseStoredShareRecord(
        JSON.stringify({ ciphertext: "YQ==", iv: "dGVz" }),
      );
      expect(rec).toEqual({ ciphertext: "YQ==", iv: "dGVz" });
    });

    it("returns ciphertext and iv from a plain object", () => {
      const rec = parseStoredShareRecord({ ciphertext: "YQ==", iv: "dGVz" });
      expect(rec).toEqual({ ciphertext: "YQ==", iv: "dGVz" });
    });

    it("returns null for null, invalid JSON, or non-record JSON", () => {
      expect(parseStoredShareRecord(null)).toBeNull();
      expect(parseStoredShareRecord("not json")).toBeNull();
      expect(parseStoredShareRecord("[1,2,3]")).toBeNull();
    });

    it("returns null when fields are empty or required fields missing", () => {
      expect(
        parseStoredShareRecord(JSON.stringify({ ciphertext: "", iv: "a" })),
      ).toBeNull();
      expect(
        parseStoredShareRecord(JSON.stringify({ ciphertext: "a" })),
      ).toBeNull();
    });

    it("rejects number and boolean payloads", () => {
      expect(parseStoredShareRecord(0)).toBeNull();
      expect(parseStoredShareRecord(false)).toBeNull();
    });
  });
});
