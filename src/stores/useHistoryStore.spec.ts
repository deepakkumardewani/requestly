import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MIN_ENTRIES_FOR_METRICS } from "@/lib/healthMonitor";
import { getDB } from "@/lib/idb";
import type { HistoryEntry, HttpTab, ResponseData } from "@/types";
import { useHistoryStore } from "./useHistoryStore";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("@/lib/constants", () => ({
  MAX_HISTORY_ENTRIES: 5,
}));

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(),
}));

function baseHttpTab(method: HistoryEntry["method"], url: string): HttpTab {
  return {
    tabId: "tab",
    requestId: null,
    name: "n",
    isDirty: false,
    type: "http",
    url,
    method,
    headers: [],
    params: [],
    auth: { type: "none" },
    body: { type: "none", content: "" },
    preScript: "",
    postScript: "",
  };
}

function baseResponse(
  method: HistoryEntry["method"],
  url: string,
  status: number,
  duration: number,
  timestamp: number,
): ResponseData {
  return {
    status,
    statusText: "OK",
    headers: {},
    body: "",
    duration,
    size: 1,
    url,
    method,
    timestamp,
  };
}

function createHistoryEntry(
  id: string,
  options: {
    method?: HistoryEntry["method"];
    url?: string;
    status?: number;
    duration?: number;
    timestamp?: number;
  } = {},
): HistoryEntry {
  const method = options.method ?? "GET";
  const url = options.url ?? "https://example.com/api";
  const ts = options.timestamp ?? 1;
  const status = options.status ?? 200;
  const duration = options.duration ?? 10;
  return {
    id,
    method,
    url,
    status,
    duration,
    size: 1,
    timestamp: ts,
    request: baseHttpTab(method, url),
    response: baseResponse(method, url, status, duration, ts),
  };
}

describe("useHistoryStore", () => {
  const put = vi.fn();
  const del = vi.fn();
  const clear = vi.fn();
  const getAllFromIndex = vi.fn();

  beforeEach(() => {
    useHistoryStore.setState({ entries: [] });
    put.mockReset();
    del.mockReset();
    clear.mockReset();
    getAllFromIndex.mockReset();
    vi.mocked(getDB).mockReturnValue(
      Promise.resolve({
        put,
        delete: del,
        clear,
        getAllFromIndex,
      } as never),
    );
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.mocked(getDB).mockReturnValue(null);
  });

  it("addEntry prepends newest entry", () => {
    useHistoryStore.getState().addEntry(createHistoryEntry("a"));
    useHistoryStore.getState().addEntry(createHistoryEntry("b"));
    expect(useHistoryStore.getState().entries.map((e) => e.id)).toEqual([
      "b",
      "a",
    ]);
  });

  it("addEntry trims to MAX_HISTORY_ENTRIES and deletes overflow from DB", async () => {
    for (let i = 0; i < 6; i++) {
      useHistoryStore.getState().addEntry(createHistoryEntry(`e${i}`));
    }
    expect(useHistoryStore.getState().entries).toHaveLength(5);
    expect(useHistoryStore.getState().entries.map((e) => e.id)).toEqual([
      "e5",
      "e4",
      "e3",
      "e2",
      "e1",
    ]);
    await Promise.resolve();
    expect(del).toHaveBeenCalledWith("history", "e0");
  });

  it("deleteEntry removes entry and calls DB delete", async () => {
    useHistoryStore.getState().addEntry(createHistoryEntry("x"));
    useHistoryStore.getState().deleteEntry("x");
    expect(useHistoryStore.getState().entries).toHaveLength(0);
    await Promise.resolve();
    expect(del).toHaveBeenCalledWith("history", "x");
  });

  it("clearHistory empties entries and clears DB", async () => {
    useHistoryStore.getState().addEntry(createHistoryEntry("y"));
    useHistoryStore.getState().clearHistory();
    expect(useHistoryStore.getState().entries).toEqual([]);
    await Promise.resolve();
    expect(clear).toHaveBeenCalledWith("history");
  });

  it("getMetricsForKey returns null when fewer than MIN_ENTRIES_FOR_METRICS", () => {
    for (let i = 0; i < MIN_ENTRIES_FOR_METRICS - 1; i++) {
      useHistoryStore.getState().addEntry(
        createHistoryEntry(`m${i}`, {
          url: "https://example.com/same",
        }),
      );
    }
    expect(
      useHistoryStore
        .getState()
        .getMetricsForKey("GET", "https://example.com/same"),
    ).toBeNull();
  });

  it("getMetricsForKey returns metrics for enough matching entries", () => {
    const url = "https://example.com/metrics";
    for (let i = 0; i < MIN_ENTRIES_FOR_METRICS; i++) {
      useHistoryStore.getState().addEntry(
        createHistoryEntry(`g${i}`, {
          url,
          status: 200,
          duration: 10 + i,
        }),
      );
    }
    const m = useHistoryStore.getState().getMetricsForKey("GET", url);
    expect(m).not.toBeNull();
    expect(m?.lastStatus).toBe(200);
    expect(m?.entryCount).toBe(MIN_ENTRIES_FOR_METRICS);
  });

  it("getRecentTimesForKey returns up to limit durations newest-first", () => {
    const url = "https://example.com/times";
    useHistoryStore
      .getState()
      .addEntry(createHistoryEntry("t1", { url, duration: 30, timestamp: 3 }));
    useHistoryStore
      .getState()
      .addEntry(createHistoryEntry("t2", { url, duration: 20, timestamp: 2 }));
    useHistoryStore
      .getState()
      .addEntry(createHistoryEntry("t3", { url, duration: 10, timestamp: 1 }));
    expect(
      useHistoryStore.getState().getRecentTimesForKey("GET", url, 2),
    ).toEqual([10, 20]);
  });

  it("hydrate early-returns when getDB is null", async () => {
    vi.mocked(getDB).mockReturnValue(null);
    await useHistoryStore.getState().hydrate();
    expect(getAllFromIndex).not.toHaveBeenCalled();
  });

  it("hydrate loads entries newest-first from indexed order", async () => {
    const rowOld = createHistoryEntry("old", { timestamp: 1 });
    const rowNew = createHistoryEntry("new", { timestamp: 2 });
    getAllFromIndex.mockResolvedValue([rowOld, rowNew]);
    await useHistoryStore.getState().hydrate();
    expect(useHistoryStore.getState().entries.map((e) => e.id)).toEqual([
      "new",
      "old",
    ]);
  });

  it("hydrate shows toast on failure", async () => {
    getAllFromIndex.mockRejectedValue(new Error("idb fail"));
    await useHistoryStore.getState().hydrate();
    expect(vi.mocked(toast.error)).toHaveBeenCalled();
  });
});
