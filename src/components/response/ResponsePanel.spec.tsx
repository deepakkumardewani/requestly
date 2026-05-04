/** @vitest-environment happy-dom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useResponseStore } from "@/stores/useResponseStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { HttpTab } from "@/types";

// ── module mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/idb", () => ({ getDB: vi.fn(() => null) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/dynamic", () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    const Comp = () => null;
    return Comp;
  },
}));

const mockRun = vi.fn();
vi.mock("@/hooks/useAI", () => ({
  useAI: vi.fn(() => ({
    run: mockRun,
    loading: false,
    error: null,
    reset: vi.fn(),
  })),
}));

// ── helpers ─────────────────────────────────────────────────────────────────

import React from "react";
import { ResponsePanel } from "./ResponsePanel";

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

function seedTab(): string {
  useTabsStore.getState().openTab({ type: "http" } as Partial<HttpTab>);
  const tab = useTabsStore.getState().tabs[0] as HttpTab;
  return tab.tabId;
}

function seedResponse(tabId: string) {
  useResponseStore.setState({
    responses: {
      [tabId]: {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ users: [{ id: 1 }] }),
        duration: 120,
        size: 42,
        url: "https://example.com/api/users",
        method: "GET",
        timestamp: 1,
      },
    },
  });
}

afterEach(() => {
  cleanup();
  resetStores();
  vi.clearAllMocks();
});

// ── tests ────────────────────────────────────────────────────────────────────

describe("ResponsePanel — AI Summarizer", () => {
  beforeEach(() => {
    mockRun.mockResolvedValue({ summary: "Returns 1 user object." });
  });

  it("shows Summarize button when a response exists", () => {
    const tabId = seedTab();
    seedResponse(tabId);

    render(<ResponsePanel tabId={tabId} onSendForce={vi.fn()} />);

    expect(screen.getByTestId("summarize-btn")).toBeInTheDocument();
  });

  it("calls useAI run with summarize-response payload on click", async () => {
    const user = userEvent.setup();
    const tabId = seedTab();
    seedResponse(tabId);

    render(<ResponsePanel tabId={tabId} onSendForce={vi.fn()} />);

    await user.click(screen.getByTestId("summarize-btn"));

    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({ status: 200 }),
    );
  });

  it("renders summary banner with AI text after successful call", async () => {
    const user = userEvent.setup();
    const tabId = seedTab();
    seedResponse(tabId);

    render(<ResponsePanel tabId={tabId} onSendForce={vi.fn()} />);

    await user.click(screen.getByTestId("summarize-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("summary-banner")).toBeInTheDocument();
      expect(screen.getByTestId("summary-text")).toHaveTextContent(
        "Returns 1 user object.",
      );
    });
  });

  it("dismisses the summary banner when ✕ is clicked", async () => {
    const user = userEvent.setup();
    const tabId = seedTab();
    seedResponse(tabId);

    render(<ResponsePanel tabId={tabId} onSendForce={vi.fn()} />);

    await user.click(screen.getByTestId("summarize-btn"));
    await screen.findByTestId("summary-banner");

    await user.click(screen.getByTestId("summary-dismiss"));

    await waitFor(() => {
      expect(screen.queryByTestId("summary-banner")).not.toBeInTheDocument();
    });
  });
});
