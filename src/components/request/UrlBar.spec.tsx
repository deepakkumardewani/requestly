/** @vitest-environment happy-dom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { HttpTab } from "@/types";
import { UrlBar } from "./UrlBar";

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const urlBarMocks = vi.hoisted(() => ({
  send: vi.fn(),
  cancel: vi.fn(),
  save: vi.fn(),
  isLoading: false,
}));

vi.mock("@/hooks/useSendRequest", () => ({
  useSendRequest: () => ({
    send: urlBarMocks.send,
    cancel: urlBarMocks.cancel,
    isLoading: urlBarMocks.isLoading,
  }),
}));

vi.mock("@/hooks/useSaveRequest", () => ({
  useSaveRequest: () => ({ save: urlBarMocks.save }),
}));

function resetStores() {
  useTabsStore.setState({ tabs: [], activeTabId: null });
  useEnvironmentsStore.setState({ environments: [], activeEnvId: null });
}

function seedHttpTab(overrides: Partial<HttpTab> = {}) {
  useTabsStore.getState().openTab({ type: "http", ...overrides });
  const tab = useTabsStore.getState().tabs[0] as HttpTab;
  return tab.tabId;
}

afterEach(() => {
  cleanup();
  resetStores();
  urlBarMocks.isLoading = false;
  vi.clearAllMocks();
});

describe("UrlBar", () => {
  beforeEach(() => {
    resetStores();
    urlBarMocks.isLoading = false;
  });

  it("renders URL input and send triggers send when idle", () => {
    const tabId = seedHttpTab({ url: "https://api.example.com" });
    render(<UrlBar tabId={tabId} />);

    const input = screen.getByTestId("url-input");
    expect(input).toHaveValue("https://api.example.com");

    fireEvent.change(input, { target: { value: "https://new.test" } });
    const t = useTabsStore.getState().tabs[0] as HttpTab;
    expect(t.url).toBe("https://new.test");

    fireEvent.click(screen.getByTestId("send-request-btn"));
    expect(urlBarMocks.send).toHaveBeenCalled();
  });

  it("send button shows Cancel and invokes cancel while loading", () => {
    urlBarMocks.isLoading = true;
    const tabId = seedHttpTab();
    render(<UrlBar tabId={tabId} />);

    expect(screen.getByTestId("send-request-btn")).toHaveTextContent("Cancel");
    fireEvent.click(screen.getByTestId("send-request-btn"));
    expect(urlBarMocks.cancel).toHaveBeenCalled();
  });

  it("method selector updates tab method", async () => {
    const tabId = seedHttpTab({ method: "GET" });
    const user = userEvent.setup();
    render(<UrlBar tabId={tabId} />);

    await user.click(screen.getByTestId("method-selector"));
    await user.click(await screen.findByTestId("method-post"));

    await waitFor(() => {
      const t = useTabsStore.getState().tabs[0] as HttpTab;
      expect(t.method).toBe("POST");
    });
  });

  it("save button invokes save hook", () => {
    const tabId = seedHttpTab();
    render(<UrlBar tabId={tabId} />);

    fireEvent.click(screen.getByTestId("save-request-btn"));
    expect(urlBarMocks.save).toHaveBeenCalled();
  });

  it("GraphQL tab renders URL input and send", () => {
    useTabsStore
      .getState()
      .openTab({ type: "graphql", url: "https://gql.test" });
    const tabId = (useTabsStore.getState().tabs[0] as { tabId: string }).tabId;

    render(<UrlBar tabId={tabId} />);

    fireEvent.change(screen.getByTestId("url-input"), {
      target: { value: "https://gql.updated" },
    });
    expect((useTabsStore.getState().tabs[0] as { url: string }).url).toBe(
      "https://gql.updated",
    );

    fireEvent.click(screen.getByTestId("send-request-btn"));
    expect(urlBarMocks.send).toHaveBeenCalled();
  });

  it("returns null when tabId is missing from store", () => {
    render(<UrlBar tabId="missing" />);
    expect(screen.queryByTestId("url-input")).toBeNull();
  });
});
