import { describe, expect, it } from "vitest";
import { explainError } from "./errorExplainer";

const HTTP_ERROR_STATUSES = [
  400, 401, 403, 404, 405, 408, 409, 410, 422, 429, 500, 502, 503, 504,
] as const;

describe("explainError", () => {
  it("returns null for success and redirect status codes", () => {
    expect(explainError(200, "")).toBeNull();
    expect(explainError(304, "")).toBeNull();
    expect(explainError(399, "")).toBeNull();
  });

  it("returns null for client errors without a mapped entry", () => {
    expect(explainError(418, "teapot")).toBeNull();
  });

  it.each(HTTP_ERROR_STATUSES)(
    "explains status %i with base fields",
    (status) => {
      const out = explainError(status, "");
      expect(out).not.toBeNull();
      if (!out) {
        return;
      }
      expect(out.title.length).toBeGreaterThan(0);
      expect(out.cause.length).toBeGreaterThan(0);
      expect(Array.isArray(out.suggestions)).toBe(true);
      expect(out.mdnUrl).toContain(String(status));
      expect(out.matchedHints).toEqual([]);
    },
  );

  it("collects matchedHints from response body keywords (case-insensitive)", () => {
    const out = explainError(404, "The resource was NOT FOUND for this id.");
    expect(out?.matchedHints.length).toBeGreaterThan(0);
  });

  it("matches partial keywords like throttle for 429", () => {
    const out = explainError(429, "You are being THROTTLED");
    expect(out?.matchedHints.some((h) => /throttl/i.test(h))).toBe(true);
  });
});
