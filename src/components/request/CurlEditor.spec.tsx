/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTabsStore } from "@/stores/useTabsStore";
import type { HttpTab } from "@/types";
import { CurlEditor } from "./CurlEditor";

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function resetTabs() {
  useTabsStore.setState({ tabs: [], activeTabId: null });
}

afterEach(() => {
  cleanup();
  resetTabs();
  vi.clearAllMocks();
});

describe("CurlEditor", () => {
  beforeEach(() => {
    resetTabs();
  });

  it("paste-style import parses cURL and updates tab", () => {
    useTabsStore.getState().openTab({
      type: "http",
      url: "",
      method: "GET",
    });
    const tabId = (useTabsStore.getState().tabs[0] as HttpTab).tabId;

    render(<CurlEditor tabId={tabId} />);

    const curl =
      "curl -X POST 'https://imported.example/api' -H 'X-Test: 1' -d '{\"k\":1}'";

    fireEvent.change(screen.getByTestId("curl-input"), {
      target: { value: curl },
    });
    fireEvent.click(screen.getByTestId("curl-import-btn"));

    const t = useTabsStore.getState().tabs[0] as HttpTab;
    expect(t.method).toBe("POST");
    expect(t.url).toBe("https://imported.example/api");
    expect(t.headers.some((h) => h.key === "X-Test" && h.value === "1")).toBe(
      true,
    );
  });

  it("shows error for malformed cURL", () => {
    useTabsStore.getState().openTab({ type: "http" });
    const tabId = (useTabsStore.getState().tabs[0] as HttpTab).tabId;

    render(<CurlEditor tabId={tabId} />);

    fireEvent.change(screen.getByTestId("curl-input"), {
      target: { value: "curl" },
    });
    fireEvent.click(screen.getByTestId("curl-import-btn"));

    expect(screen.getByText(/parse/i)).toBeInTheDocument();
  });

  it("renders generated cURL for current tab", () => {
    useTabsStore.getState().openTab({
      type: "http",
      url: "https://gen.example.com",
      method: "GET",
    });
    const tabId = (useTabsStore.getState().tabs[0] as HttpTab).tabId;

    render(<CurlEditor tabId={tabId} />);

    expect(screen.getByTestId("generated-curl")).toHaveTextContent(
      "gen.example.com",
    );
  });
});
