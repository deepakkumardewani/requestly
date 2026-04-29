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
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";
import type { HttpTab } from "@/types";
import { TabContextMenu } from "./TabContextMenu";

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

function resetStores() {
  useTabsStore.setState({ tabs: [], activeTabId: null });
  useUIStore.setState({ pendingCloseTabId: null, pendingBulkClose: null });
}

function seedHttpTab(overrides: Partial<HttpTab> = {}) {
  useTabsStore
    .getState()
    .openTab({ type: "http", name: "My Request", ...overrides });
  const { tabs } = useTabsStore.getState();
  return tabs[tabs.length - 1] as HttpTab;
}

function renderOpenMenu(tab: HttpTab) {
  render(
    <ContextMenu open>
      <ContextMenuTrigger>
        <button type="button">Tab surface</button>
      </ContextMenuTrigger>
      <TabContextMenu tab={tab} />
    </ContextMenu>,
  );
}

afterEach(() => {
  cleanup();
  resetStores();
  vi.clearAllMocks();
});

describe("TabContextMenu", () => {
  beforeEach(() => {
    resetStores();
  });

  it("Duplicate Tab adds a second tab with same HTTP fields", async () => {
    const user = userEvent.setup();
    const tab = seedHttpTab({ url: "https://dup.test", name: "Original" });
    renderOpenMenu(tab);

    await user.click(
      await screen.findByRole("menuitem", { name: /duplicate tab/i }),
    );
    const { tabs } = useTabsStore.getState();
    expect(tabs.length).toBe(2);
    const clone = tabs.find((t) => t.tabId !== tab.tabId) as HttpTab;
    expect(clone.type).toBe("http");
    expect(clone.url).toBe("https://dup.test");
    expect(clone.name).toBe("Original");
    expect(clone.isDirty).toBe(false);
  });

  it("Close Tab defers to guard when tab is dirty", () => {
    const tab = seedHttpTab({ isDirty: true });
    renderOpenMenu(tab);
    fireEvent.click(screen.getByRole("menuitem", { name: /^close tab$/i }));
    expect(useTabsStore.getState().tabs).toHaveLength(1);
    expect(useUIStore.getState().pendingCloseTabId).toBe(tab.tabId);
  });

  it("Close Other Tabs is disabled when only one tab exists", () => {
    const tab = seedHttpTab();
    renderOpenMenu(tab);
    expect(
      screen.getByRole("menuitem", { name: /close other tabs/i }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("Close Other Tabs with two clean tabs keeps the tab the menu was opened for", async () => {
    const user = userEvent.setup();
    seedHttpTab({ name: "First" });
    const second = seedHttpTab({ name: "Second" });
    renderOpenMenu(second);

    await user.click(
      screen.getByRole("menuitem", { name: /close other tabs/i }),
    );
    const { tabs } = useTabsStore.getState();
    expect(tabs.length).toBe(1);
    expect(tabs[0]?.tabId).toBe(second.tabId);
  });

  it("Rename updates tab name after committing blur", async () => {
    const user = userEvent.setup();
    const tab = seedHttpTab({ name: "Old" });
    renderOpenMenu(tab);

    await user.click(screen.getByRole("menuitem", { name: /^rename$/i }));
    const input = await screen.findByRole("textbox");
    fireEvent.change(input, { target: { value: "Renamed" } });
    fireEvent.blur(input);

    await waitFor(() => {
      const t = useTabsStore.getState().tabs[0] as HttpTab;
      expect(t.name).toBe("Renamed");
    });
  });
});
