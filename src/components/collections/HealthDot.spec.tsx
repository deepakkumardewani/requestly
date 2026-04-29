/** @vitest-environment happy-dom */

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useUIStore } from "@/stores/useUIStore";
import type { HistoryEntry, HttpTab } from "@/types";
import { HealthDot } from "./HealthDot";

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

function httpTab(partial: Partial<HttpTab> = {}): HttpTab {
  return {
    tabId: "t0",
    requestId: null,
    name: "r",
    isDirty: false,
    type: "http",
    url: "https://api.example.com/v1",
    method: "GET",
    headers: [],
    params: [],
    auth: { type: "none" },
    body: { type: "none", content: "" },
    preScript: "",
    postScript: "",
    ...partial,
  };
}

function entry(
  id: string,
  url: string,
  overrides: Partial<HistoryEntry> = {},
): HistoryEntry {
  const method = overrides.method ?? "GET";
  const tab = httpTab({ url, method, ...overrides.request });
  return {
    id,
    method,
    url,
    status: 200,
    duration: 10,
    size: 1,
    timestamp: Date.now(),
    response: {
      status: 200,
      statusText: "OK",
      headers: {},
      body: "",
      duration: 10,
      size: 1,
      url,
      method,
      timestamp: Date.now(),
    },
    ...overrides,
    request: overrides.request ? { ...tab, ...overrides.request } : tab,
  };
}

describe("HealthDot", () => {
  beforeEach(() => {
    useHistoryStore.setState({ entries: [] });
    useUIStore.setState({ historyFilter: null } as Partial<
      ReturnType<typeof useUIStore.getState>
    >);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders success metrics when enough history exists for the route", () => {
    const url = "https://metrics.example.com/api/items";
    useHistoryStore.setState({
      entries: Array.from({ length: 5 }, (_, i) =>
        entry(`h-${i}`, url, {
          status: 200,
          duration: 10 + i,
          method: "GET",
        }),
      ),
    });

    render(<HealthDot method="GET" url={url} />);

    expect(screen.getByLabelText(/success/i)).toBeInTheDocument();
    expect(screen.getByText(/\d+%/)).toBeInTheDocument();
  });
});
