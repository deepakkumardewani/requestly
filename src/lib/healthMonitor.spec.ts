import { describe, expect, it } from "vitest";
import type { HistoryEntry, HttpMethod, ResponseData } from "@/types";
import {
  computeHealthMetrics,
  getEntriesForKey,
  healthKey,
  MIN_ENTRIES_FOR_METRICS,
  normaliseUrl,
} from "./healthMonitor";

function minimalResponse(): ResponseData {
  return {
    status: 200,
    statusText: "OK",
    headers: {},
    body: "",
    duration: 0,
    size: 0,
    url: "",
    method: "GET",
    timestamp: 0,
  };
}

function makeEntry(
  overrides: Partial<HistoryEntry> & Pick<HistoryEntry, "method" | "url">,
): HistoryEntry {
  const {
    method,
    url,
    status = 200,
    duration = 100,
    id = "e1",
    size = 0,
    timestamp = Date.now(),
    request = {} as HistoryEntry["request"],
    response = minimalResponse(),
    ...rest
  } = overrides;
  return {
    id,
    method,
    url,
    status,
    duration,
    size,
    timestamp,
    request,
    response,
    ...rest,
  };
}

describe("normaliseUrl", () => {
  it("replaces uuid and numeric path segments with {id}", () => {
    expect(
      normaliseUrl(
        "https://api.test/v1/550e8400-e29b-41d4-a716-446655440000/users",
      ),
    ).toBe("https://api.test/v1/{id}/users");
    expect(normaliseUrl("https://x.test/items/42/detail")).toBe(
      "https://x.test/items/{id}/detail",
    );
  });

  it("returns original string when URL is invalid", () => {
    expect(normaliseUrl("not://space")).toContain("not");
  });
});

describe("healthKey", () => {
  it("uppercases method and uses normalised URL", () => {
    expect(healthKey("get", "https://x.test/ITEMS/99")).toBe(
      "GET:https://x.test/ITEMS/{id}",
    );
  });
});

describe("computeHealthMetrics", () => {
  it("returns null when below minimum sample size", () => {
    const entries = Array.from(
      { length: MIN_ENTRIES_FOR_METRICS - 1 },
      (_, i) =>
        makeEntry({ method: "GET", url: "https://a.test", duration: 10 + i }),
    );
    expect(computeHealthMetrics(entries)).toBeNull();
  });

  it("computes success rate and percentiles over the recent window", () => {
    const entries: HistoryEntry[] = [];
    for (let i = 0; i < 10; i++) {
      entries.push(
        makeEntry({
          id: `e${i}`,
          method: "GET",
          url: "https://same.test",
          status: i < 8 ? 200 : 500,
          duration: (i + 1) * 10,
        }),
      );
    }
    const m = computeHealthMetrics(entries);
    expect(m).not.toBeNull();
    if (!m) {
      return;
    }
    expect(m.successRate).toBe(80);
    expect(m.entryCount).toBe(10);
    expect(m.lastStatus).toBe(200);
    expect(m.p50).toBeGreaterThan(0);
    expect(m.p95).toBeGreaterThanOrEqual(m.p50);
  });
});

describe("getEntriesForKey", () => {
  it("filters entries matching method:url health key", () => {
    const method: HttpMethod = "POST";
    const url = "https://z.test/res/1";
    const key = healthKey(method, url);
    const a = makeEntry({ method, url });
    const b = makeEntry({ method: "GET", url });
    expect(getEntriesForKey([a, b], key)).toEqual([a]);
  });
});
