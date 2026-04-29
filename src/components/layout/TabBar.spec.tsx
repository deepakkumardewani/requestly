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
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";
import type { HttpTab } from "@/types";
import { TabBar } from "./TabBar";

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/layout/TabListDropdown", () => ({
  TabListDropdown: () => <div data-testid="tab-list-dropdown" />,
}));

function resetStores() {
  useTabsStore.setState({ tabs: [], activeTabId: null });
  useUIStore.setState({
    pendingCloseTabId: null,
    pendingBulkClose: null,
    saveModalOpen: false,
    commandPaletteOpen: false,
    keyboardShortcutsOpen: false,
  });
}

function seedTabs(items: Array<{ name: string; isDirty?: boolean }>) {
  items.forEach(({ name, isDirty }) => {
    useTabsStore.getState().openTab({
      type: "http",
      name,
      isDirty: isDirty ?? false,
    } as Partial<HttpTab>);
  });
}

beforeEach(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  resetStores();
});

afterEach(() => {
  cleanup();
  resetStores();
  vi.clearAllMocks();
});

describe("TabBar", () => {
  it("renders tabs from the store with readable names", () => {
    seedTabs([{ name: "Alpha" }, { name: "Beta" }]);
    render(<TabBar />);
    const tabs = screen.getAllByTestId("tab");
    expect(tabs).toHaveLength(2);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("selecting a tab updates the active tab in the store", async () => {
    const user = userEvent.setup();
    seedTabs([{ name: "First" }, { name: "Second" }]);
    const [a, b] = useTabsStore.getState().tabs;
    useTabsStore.setState({ activeTabId: a.tabId });
    render(<TabBar />);

    await user.click(screen.getByText("Second"));
    expect(useTabsStore.getState().activeTabId).toBe(b.tabId);
  });

  it("active tab shows accent underline region (active styling)", () => {
    seedTabs([{ name: "Only" }]);
    render(<TabBar />);
    const tabEl = screen.getByTestId("tab");
    const accent = tabEl.querySelector(".bg-method-accent");
    expect(accent).toBeTruthy();
  });

  it("closes a clean tab immediately without confirmation", () => {
    seedTabs([{ name: "Close me" }]);
    const tabId = useTabsStore.getState().tabs[0].tabId;
    render(<TabBar />);
    fireEvent.click(screen.getByLabelText(/close close me tab/i));
    expect(useTabsStore.getState().tabs).toHaveLength(0);
    expect(useTabsStore.getState().activeTabId).toBeNull();
    expect(useUIStore.getState().pendingCloseTabId).toBeNull();
    expect(tabId).toBeDefined();
  });

  it("opening close guard for dirty tab shows unsaved dialog", () => {
    seedTabs([{ name: "Dirty", isDirty: true }]);
    render(<TabBar />);
    fireEvent.click(screen.getByLabelText(/close dirty tab/i));
    expect(useUIStore.getState().pendingCloseTabId).toBe(
      useTabsStore.getState().tabs[0].tabId,
    );
    expect(screen.getByTestId("close-tab-dialog")).toBeVisible();
  });

  it("confirm close in dialog removes dirty tab", async () => {
    seedTabs([{ name: "Dirty", isDirty: true }]);
    const tabId = useTabsStore.getState().tabs[0].tabId;
    render(<TabBar />);
    fireEvent.click(screen.getByLabelText(/close dirty tab/i));
    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    await waitFor(() => {
      expect(useTabsStore.getState().tabs).toHaveLength(0);
    });
    expect(useTabsStore.getState().activeTabId).toBeNull();
    expect(useUIStore.getState().pendingCloseTabId).toBeNull();
    expect(tabId).toBeDefined();
  });

  it("new tab button opens an additional tab when not overflowing", async () => {
    const user = userEvent.setup();
    seedTabs([{ name: "One" }]);
    render(<TabBar />);
    const newBtns = screen.getAllByTestId("new-tab-btn");
    await user.click(newBtns[0]!);
    expect(useTabsStore.getState().tabs.length).toBe(2);
  });

  it("renders tab bar root for layout tests", () => {
    seedTabs([{ name: "Single" }]);
    render(<TabBar />);
    expect(screen.getByTestId("tab-bar")).toBeInTheDocument();
  });
});
