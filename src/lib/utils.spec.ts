import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildFinalUrl,
  buildUrlWithParams,
  cn,
  formatBytes,
  formatDuration,
  generateId,
  getRelativeTime,
  interpolateVariables,
  parsePathParams,
  parseQueryString,
  syncParamsFromUrl,
  truncateUrl,
} from "./utils";

describe("cn", () => {
  it("merges class tokens", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});

describe("formatBytes", () => {
  it("formats zero and scales units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toMatch(/^1(\.0)? KB$/);
    expect(formatBytes(1024 * 1024)).toContain("MB");
  });
});

describe("formatDuration", () => {
  it("uses ms under one second and seconds above", () => {
    expect(formatDuration(500)).toBe("500 ms");
    expect(formatDuration(1500)).toBe("1.50 s");
  });
});

describe("generateId", () => {
  it("returns a UUID-shaped string", () => {
    expect(generateId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

describe("interpolateVariables", () => {
  it("replaces known keys", () => {
    expect(interpolateVariables("{{a}}", { a: "x" })).toBe("x");
  });
});

describe("parsePathParams", () => {
  it("extracts :param tokens from path before query", () => {
    expect(parsePathParams("https://h/:id/:id2?x=1")).toEqual(["id", "id2"]);
    expect(parsePathParams("noop")).toEqual([]);
  });
});

describe("parseQueryString", () => {
  it("parses full URL or relative path with placeholder origin", () => {
    expect(parseQueryString("https://a.test?q=1&x=y")).toEqual([
      { key: "q", value: "1" },
      { key: "x", value: "y" },
    ]);
    expect(parseQueryString("relative?q=1")).toEqual([
      { key: "q", value: "1" },
    ]);
  });

  it("returns [] on invalid URL input", () => {
    expect(parseQueryString("http://[")).toEqual([]);
  });
});

describe("buildFinalUrl", () => {
  it("encodes path params and appends query string", () => {
    expect(
      buildFinalUrl("https://x/:id", [
        { key: "id", value: "a/b", enabled: true, type: "path" },
        { key: "q", value: "1", enabled: true, type: "query" },
      ]),
    ).toBe("https://x/a%2Fb?q=1");
  });
});

describe("buildUrlWithParams", () => {
  it("returns base without query when no enabled params", () => {
    expect(buildUrlWithParams("https://a.test/old?q=1", [])).toBe(
      "https://a.test/old",
    );
  });

  it("returns original base when encodeURIComponent throws", () => {
    const spy = vi
      .spyOn(globalThis, "encodeURIComponent")
      .mockImplementationOnce(() => {
        throw new Error("fail");
      });
    const out = buildUrlWithParams("https://a.test", [
      { key: "k", value: "v", enabled: true },
    ]);
    spy.mockRestore();
    expect(out).toBe("https://a.test");
  });
});

describe("syncParamsFromUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("derives path params from URL and merges query from URL when present", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("fixed-uuid");
    const existing = [{ id: "keep", key: "oldQ", value: "z", enabled: true }];
    const { pathParams, queryParams } = syncParamsFromUrl(
      "https://h/users/:userId/details?oldQ=new&other=1",
      existing,
    );
    expect(pathParams.map((p) => p.key)).toEqual(["userId"]);
    expect(queryParams.map((p) => [p.key, p.value])).toEqual([
      ["oldQ", "new"],
      ["other", "1"],
    ]);
  });

  it("preserves existing query param rows when URL has no query", () => {
    const existing = [{ id: "e1", key: "a", value: "1", enabled: true }];
    const { queryParams } = syncParamsFromUrl("https://h/test", existing);
    expect(queryParams).toEqual(existing);
  });
});

describe("truncateUrl", () => {
  it("returns original when short enough", () => {
    expect(truncateUrl("abc", 10)).toBe("abc");
    expect(truncateUrl("abcdefghijklmnop", 10).endsWith("…")).toBe(true);
  });
});

describe("getRelativeTime", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("buckets elapsed time into human phrases", () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    expect(getRelativeTime(now - 30_000)).toBe("just now");
    expect(getRelativeTime(now - 120_000)).toBe("2m ago");
    expect(getRelativeTime(now - 3_600_000)).toBe("1h ago");
    expect(getRelativeTime(now - 48 * 3_600_000)).toBe("2d ago");
  });
});
