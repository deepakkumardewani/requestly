import { afterEach, describe, expect, it, vi } from "vitest";
import {
  enforceShareRateLimit,
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
      const incr = vi.fn().mockResolvedValue(1);
      const expire = vi.fn().mockResolvedValue(1);
      const out = await enforceShareRateLimit({ incr, expire }, "user-a");
      expect(out).toBe("ok");
      expect(incr).toHaveBeenCalledWith("ratelimit:user-a");
      expect(expire).toHaveBeenCalledWith("ratelimit:user-a", 3600);
    });

    it("does not call expire when count is not 1", async () => {
      const incr = vi.fn().mockResolvedValue(2);
      const expire = vi.fn();
      const out = await enforceShareRateLimit({ incr, expire }, "user-b");
      expect(out).toBe("ok");
      expect(expire).not.toHaveBeenCalled();
    });

    it("returns rate_limited when count exceeds cap", async () => {
      const incr = vi.fn().mockResolvedValue(21);
      const expire = vi.fn();
      const out = await enforceShareRateLimit({ incr, expire }, "user-c");
      expect(out).toBe("rate_limited");
    });

    it("returns ok at exactly the cap", async () => {
      const incr = vi.fn().mockResolvedValue(20);
      const expire = vi.fn();
      const out = await enforceShareRateLimit({ incr, expire }, "user-d");
      expect(out).toBe("ok");
    });
  });
});
