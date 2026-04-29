import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "./useUIStore";

const initial = () => useUIStore.getState();

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      leftPanelWidth: 280,
      splitRatio: 50,
      commandPaletteOpen: false,
      mobileSidebarOpen: false,
      historyFilter: null,
      saveModalOpen: false,
      pendingCloseTabId: null,
      pendingBulkClose: null,
      isCreatingCollection: false,
      isCreatingEnv: false,
      envManagerOpen: false,
      envManagerFocusEnvId: null,
      keyboardShortcutsOpen: false,
    });
  });

  it("has expected default layout and closed modals", () => {
    expect(initial().leftPanelWidth).toBe(280);
    expect(initial().splitRatio).toBe(50);
    expect(initial().commandPaletteOpen).toBe(false);
    expect(initial().historyFilter).toBeNull();
    expect(initial().saveModalOpen).toBe(false);
  });

  it("setLeftPanelWidth and setSplitRatio update layout", () => {
    useUIStore.getState().setLeftPanelWidth(320);
    useUIStore.getState().setSplitRatio(42);
    expect(useUIStore.getState().leftPanelWidth).toBe(320);
    expect(useUIStore.getState().splitRatio).toBe(42);
  });

  it("toggleCommandPalette flips command palette", () => {
    useUIStore.getState().toggleCommandPalette();
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    useUIStore.getState().toggleCommandPalette();
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it("setCommandPaletteOpen sets palette visibility", () => {
    useUIStore.getState().setCommandPaletteOpen(true);
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
  });

  it("toggleMobileSidebar flips mobile sidebar", () => {
    useUIStore.getState().toggleMobileSidebar();
    expect(useUIStore.getState().mobileSidebarOpen).toBe(true);
    useUIStore.getState().toggleMobileSidebar();
    expect(useUIStore.getState().mobileSidebarOpen).toBe(false);
  });

  it("setHistoryFilter sets filter text", () => {
    useUIStore.getState().setHistoryFilter("GET");
    expect(useUIStore.getState().historyFilter).toBe("GET");
    useUIStore.getState().setHistoryFilter(null);
    expect(useUIStore.getState().historyFilter).toBeNull();
  });

  it("setSaveModalOpen controls save modal", () => {
    useUIStore.getState().setSaveModalOpen(true);
    expect(useUIStore.getState().saveModalOpen).toBe(true);
  });

  it("setPendingCloseTabId tracks tab id", () => {
    useUIStore.getState().setPendingCloseTabId("tab-1");
    expect(useUIStore.getState().pendingCloseTabId).toBe("tab-1");
  });

  it("setPendingBulkClose sets bulk close action", () => {
    useUIStore.getState().setPendingBulkClose({ kind: "all" });
    expect(useUIStore.getState().pendingBulkClose).toEqual({ kind: "all" });
    useUIStore
      .getState()
      .setPendingBulkClose({ kind: "others", keepTabId: "k" });
    expect(useUIStore.getState().pendingBulkClose).toEqual({
      kind: "others",
      keepTabId: "k",
    });
  });

  it("setIsCreatingCollection and setIsCreatingEnv toggle flags", () => {
    useUIStore.getState().setIsCreatingCollection(true);
    useUIStore.getState().setIsCreatingEnv(true);
    expect(useUIStore.getState().isCreatingCollection).toBe(true);
    expect(useUIStore.getState().isCreatingEnv).toBe(true);
  });

  it("setEnvManagerOpen sets open state and optional focus id", () => {
    useUIStore.getState().setEnvManagerOpen(true, "env-9");
    expect(useUIStore.getState().envManagerOpen).toBe(true);
    expect(useUIStore.getState().envManagerFocusEnvId).toBe("env-9");
    useUIStore.getState().setEnvManagerOpen(false);
    expect(useUIStore.getState().envManagerOpen).toBe(false);
    expect(useUIStore.getState().envManagerFocusEnvId).toBeNull();
  });

  it("setKeyboardShortcutsOpen toggles shortcuts dialog", () => {
    useUIStore.getState().setKeyboardShortcutsOpen(true);
    expect(useUIStore.getState().keyboardShortcutsOpen).toBe(true);
  });
});
