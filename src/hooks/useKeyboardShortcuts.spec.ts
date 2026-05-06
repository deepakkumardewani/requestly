/** @vitest-environment happy-dom */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDB } from "@/lib/idb";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

function resetStores() {
  useTabsStore.setState({ tabs: [], activeTabId: null });
  useUIStore.setState({
    commandPaletteOpen: false,
    keyboardShortcutsOpen: false,
  });
}

function fireKey(opts: KeyboardEventInit) {
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ...opts,
      }),
    );
  });
}

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    vi.mocked(getDB).mockReturnValue(null);
    resetStores();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("invokes onSend on Ctrl+Enter", () => {
    const shortcuts = { onSend: vi.fn() };
    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKey({ ctrlKey: true, key: "Enter" });
    expect(shortcuts.onSend).toHaveBeenCalledTimes(1);
  });

  it("invokes onSend on Cmd+Enter", () => {
    const shortcuts = { onSend: vi.fn() };
    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKey({ metaKey: true, key: "Enter" });
    expect(shortcuts.onSend).toHaveBeenCalledTimes(1);
  });

  it("invokes onSave on Ctrl+S", () => {
    const shortcuts = { onSave: vi.fn() };
    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKey({ ctrlKey: true, key: "s" });
    expect(shortcuts.onSave).toHaveBeenCalledTimes(1);
  });

  it("prefers onCloseTab over store closeTab on Ctrl+W", () => {
    useTabsStore.getState().openTab({ name: "a" });
    useTabsStore.getState().openTab({ name: "b" });
    const tabs = useTabsStore.getState().tabs;
    const onCloseTab = vi.fn();
    const shortcuts = { onCloseTab };
    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKey({ ctrlKey: true, key: "w" });
    expect(onCloseTab).toHaveBeenCalledTimes(1);
    expect(useTabsStore.getState().tabs).toHaveLength(2);
  });

  it("closes active tab via store when onCloseTab is omitted", () => {
    useTabsStore.getState().openTab({ name: "a" });
    useTabsStore.getState().openTab({ name: "b" });
    renderHook(() => useKeyboardShortcuts({}));
    const initialLen = useTabsStore.getState().tabs.length;
    fireKey({ ctrlKey: true, key: "w" });
    expect(useTabsStore.getState().tabs.length).toBe(initialLen - 1);
  });

  it("invokes onCloseAllTabs on Ctrl+Shift+W", () => {
    const onCloseAllTabs = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onCloseAllTabs }));
    fireKey({ ctrlKey: true, shiftKey: true, key: "w" });
    expect(onCloseAllTabs).toHaveBeenCalledTimes(1);
  });

  it("calls onNewRequest when provided on Ctrl+N", () => {
    const onNewRequest = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onNewRequest }));
    fireKey({ ctrlKey: true, key: "n" });
    expect(onNewRequest).toHaveBeenCalledTimes(1);
  });

  it("falls back to openTab when Ctrl+N and no onNewRequest", () => {
    renderHook(() => useKeyboardShortcuts({}));
    fireKey({ ctrlKey: true, key: "n" });
    expect(useTabsStore.getState().tabs.length).toBe(1);
  });

  it("invokes onNewCollection on Ctrl+Shift+N", () => {
    const onNewCollection = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onNewCollection }));
    fireKey({ ctrlKey: true, shiftKey: true, key: "n" });
    expect(onNewCollection).toHaveBeenCalledTimes(1);
  });

  it("invokes onTransformPlayground on Ctrl+Shift+T", () => {
    const onTransformPlayground = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onTransformPlayground }));
    fireKey({ ctrlKey: true, shiftKey: true, key: "t" });
    expect(onTransformPlayground).toHaveBeenCalledTimes(1);
  });

  it("uses Ctrl+T as new-request alias when onNewRequest missing", () => {
    renderHook(() => useKeyboardShortcuts({}));
    fireKey({ ctrlKey: true, key: "t" });
    expect(useTabsStore.getState().tabs.length).toBe(1);
  });

  it("does not handle Cmd+T as shortcut (Ctrl-only)", () => {
    const onNewRequest = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onNewRequest }));
    fireKey({ metaKey: true, key: "t" });
    expect(onNewRequest).not.toHaveBeenCalled();
  });

  it("toggles command palette on Ctrl+K", () => {
    renderHook(() => useKeyboardShortcuts({}));
    fireKey({ ctrlKey: true, key: "k" });
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
  });

  it("toggles command palette on Cmd+K", () => {
    renderHook(() => useKeyboardShortcuts({}));
    fireKey({ metaKey: true, key: "k" });
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
  });

  it("activates previous tab on Ctrl+[", () => {
    useTabsStore.getState().openTab({ name: "1" });
    useTabsStore.getState().openTab({ name: "2" });
    const [first, second] = useTabsStore.getState().tabs;
    useTabsStore.getState().setActiveTab(second.tabId);
    renderHook(() => useKeyboardShortcuts({}));
    fireKey({ ctrlKey: true, key: "[" });
    expect(useTabsStore.getState().activeTabId).toBe(first.tabId);
  });

  it("activates next tab on Ctrl+]", () => {
    useTabsStore.getState().openTab({ name: "1" });
    useTabsStore.getState().openTab({ name: "2" });
    const [first, second] = useTabsStore.getState().tabs;
    useTabsStore.getState().setActiveTab(first.tabId);
    renderHook(() => useKeyboardShortcuts({}));
    fireKey({ ctrlKey: true, key: "]" });
    expect(useTabsStore.getState().activeTabId).toBe(second.tabId);
  });

  it("invokes environment and settings handlers", () => {
    const onManageEnvironments = vi.fn();
    const onOpenSettings = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ onManageEnvironments, onOpenSettings }),
    );
    fireKey({ ctrlKey: true, key: "e" });
    fireKey({ ctrlKey: true, key: "," });
    expect(onManageEnvironments).toHaveBeenCalledTimes(1);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("invokes import and JSON compare handlers", () => {
    const onImportCollection = vi.fn();
    const onCompareJson = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ onImportCollection, onCompareJson }),
    );
    fireKey({ ctrlKey: true, key: "i" });
    fireKey({ ctrlKey: true, key: "j" });
    expect(onImportCollection).toHaveBeenCalledTimes(1);
    expect(onCompareJson).toHaveBeenCalledTimes(1);
  });

  it("opens keyboard shortcuts modal on Ctrl+/", () => {
    renderHook(() => useKeyboardShortcuts({}));
    fireKey({ ctrlKey: true, key: "/" });
    expect(useUIStore.getState().keyboardShortcutsOpen).toBe(true);
  });

  it("ignores plain keys without modifier", () => {
    const onSend = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSend }));
    fireKey({ key: "Enter" });
    expect(onSend).not.toHaveBeenCalled();
  });
});
