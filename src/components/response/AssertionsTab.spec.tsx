/** @vitest-environment happy-dom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useResponseStore } from "@/stores/useResponseStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { HttpTab } from "@/types";
import type { ChainAssertion } from "@/types/chain";
import { AssertionsTab } from "./AssertionsTab";

vi.mock("@/lib/idb", () => ({ getDB: vi.fn(() => null) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));

const mockRun = vi.fn();
vi.mock("@/hooks/useAI", () => ({
  useAI: vi.fn((action: string) => ({
    run: action === "suggest-jsonpath" ? mockJsonpathRun : mockRun,
    loading: false,
    error: null,
    reset: vi.fn(),
  })),
}));

function resetStores() {
  useTabsStore.setState({ tabs: [], activeTabId: null });
  useResponseStore.setState({
    responses: {},
    loading: {},
    errors: {},
    scriptLogs: {},
    assertionResults: {},
    unresolvedVars: {},
  });
}

function seedTab(assertions: ChainAssertion[] = []): string {
  useTabsStore.getState().openTab({ type: "http", assertions } as Partial<HttpTab>);
  return (useTabsStore.getState().tabs[0] as HttpTab).tabId;
}

function seedResponse(tabId: string) {
  useResponseStore.setState({
    responses: {
      [tabId]: {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: 1, name: "Alice" }),
        duration: 80,
        size: 30,
        url: "https://example.com/api/users/1",
        method: "GET",
        timestamp: 1,
      },
    },
  });
}

const mockJsonpathRun = vi.fn();

vi.mock("../ui/popover", () => ({
  Popover: ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (v: boolean) => void }) => (
    <div data-testid="popover-root" data-open={open}>{children}</div>
  ),
  PopoverTrigger: ({ children, ...rest }: React.HTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button type="button" {...rest}>{children}</button>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
}));

afterEach(() => {
  cleanup();
  resetStores();
  vi.clearAllMocks();
});

describe("AssertionsTab — AI Assertion Suggester", () => {
  beforeEach(() => resetStores());

  it("button is disabled when no response exists", () => {
    const tabId = seedTab();
    render(<AssertionsTab tabId={tabId} />);
    expect(screen.getByTestId("suggest-assertions-btn")).toBeDisabled();
  });

  it("button is enabled when a response exists", () => {
    const tabId = seedTab();
    seedResponse(tabId);
    render(<AssertionsTab tabId={tabId} />);
    expect(screen.getByTestId("suggest-assertions-btn")).not.toBeDisabled();
  });

  it("calls useAI run with status, headers, and bodySnippet on click", async () => {
    mockRun.mockResolvedValueOnce([]);
    const tabId = seedTab();
    seedResponse(tabId);
    const user = userEvent.setup();
    render(<AssertionsTab tabId={tabId} />);

    await user.click(screen.getByTestId("suggest-assertions-btn"));

    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({ status: 200, bodySnippet: expect.any(String) }),
    );
  });

  it("merges suggested assertions into existing ones without replacing them", async () => {
    const existing: ChainAssertion = {
      id: "existing-1",
      source: "status",
      operator: "eq",
      expectedValue: "200",
      enabled: true,
    };
    mockRun.mockResolvedValueOnce([
      { source: "jsonpath", sourcePath: "$.id", operator: "exists" },
      { source: "header", sourcePath: "content-type", operator: "contains", expectedValue: "json" },
    ]);
    const tabId = seedTab([existing]);
    seedResponse(tabId);
    const user = userEvent.setup();
    render(<AssertionsTab tabId={tabId} />);

    await user.click(screen.getByTestId("suggest-assertions-btn"));

    await waitFor(() => {
      const tab = useTabsStore.getState().tabs[0] as HttpTab;
      expect(tab.assertions?.length).toBe(3);
      // pre-existing row preserved
      expect(tab.assertions?.some((a) => a.id === "existing-1")).toBe(true);
      // suggested rows appended
      expect(tab.assertions?.some((a) => a.source === "jsonpath")).toBe(true);
      expect(tab.assertions?.some((a) => a.source === "header")).toBe(true);
    });
  });

  it("each suggested assertion has a unique id and enabled: true", async () => {
    mockRun.mockResolvedValueOnce([
      { source: "status", operator: "eq", expectedValue: "200" },
      { source: "jsonpath", sourcePath: "$.name", operator: "exists" },
    ]);
    const tabId = seedTab();
    seedResponse(tabId);
    const user = userEvent.setup();
    render(<AssertionsTab tabId={tabId} />);

    await user.click(screen.getByTestId("suggest-assertions-btn"));

    await waitFor(() => {
      const tab = useTabsStore.getState().tabs[0] as HttpTab;
      const ids = tab.assertions?.map((a) => a.id) ?? [];
      // all enabled
      expect(tab.assertions?.every((a) => a.enabled)).toBe(true);
      // all ids unique and non-empty
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.length > 0)).toBe(true);
    });
  });
});

describe("AssertionsTab — JSONPath AI Helper", () => {
  beforeEach(() => resetStores());

  it("✨ button only renders on jsonpath rows, not header or status rows", () => {
    const assertions: ChainAssertion[] = [
      { id: "a1", source: "status", operator: "eq", expectedValue: "200", enabled: true },
      { id: "a2", source: "jsonpath", sourcePath: "$.id", operator: "exists", enabled: true },
      { id: "a3", source: "header", sourcePath: "content-type", operator: "contains", expectedValue: "json", enabled: true },
    ];
    const tabId = seedTab(assertions);
    render(<AssertionsTab tabId={tabId} />);

    const aiBtns = screen.queryAllByTestId("jsonpath-row-ai-btn");
    expect(aiBtns).toHaveLength(1);
  });

  it("clicking ✨ button opens popover with prompt input", async () => {
    const assertions: ChainAssertion[] = [
      { id: "a1", source: "jsonpath", sourcePath: "$.id", operator: "exists", enabled: true },
    ];
    const tabId = seedTab(assertions);
    render(<AssertionsTab tabId={tabId} />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId("jsonpath-row-ai-btn"));
    expect(screen.getByTestId("jsonpath-row-ai-input")).toBeInTheDocument();
  });

  it("confirming AI prompt updates the sourcePath for that row only", async () => {
    mockJsonpathRun.mockResolvedValueOnce({ expression: "$.user.email" });
    const assertions: ChainAssertion[] = [
      { id: "a1", source: "jsonpath", sourcePath: "$.id", operator: "exists", enabled: true },
    ];
    const tabId = seedTab(assertions);
    render(<AssertionsTab tabId={tabId} />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId("jsonpath-row-ai-btn"));
    await user.type(screen.getByTestId("jsonpath-row-ai-input"), "user's email");
    await user.click(screen.getByTestId("jsonpath-row-ai-confirm"));

    expect(mockJsonpathRun).toHaveBeenCalledWith(
      expect.objectContaining({ description: "user's email" }),
    );

    await waitFor(() => {
      const tab = useTabsStore.getState().tabs[0] as HttpTab;
      expect(tab.assertions?.[0].sourcePath).toBe("$.user.email");
    });
  });
});
