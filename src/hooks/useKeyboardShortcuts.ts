"use client";

import { useEffect } from "react";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";

type ShortcutHandlers = {
  onSend?: () => void;
  onSave?: () => void;
  onCloseTab?: () => void;
  onCloseAllTabs?: () => void;
  onNewRequest?: () => void;
  onNewCollection?: () => void;
  onManageEnvironments?: () => void;
  onOpenSettings?: () => void;
  onImportCollection?: () => void;
  onTransformPlayground?: () => void;
  onCompareJson?: () => void;
};

/**
 * Attaches global keyboard shortcuts to window.
 * Call from the component that owns the send/save handlers.
 *
 * Shortcuts (all use Ctrl, not Cmd, to avoid macOS browser conflicts):
 *   Ctrl+Enter       → Send request
 *   Ctrl+S           → Save request
 *   Ctrl+N           → New request
 *   Ctrl+Shift+N     → New collection
 *   Ctrl+T           → New request (alias)
 *   Ctrl+W           → Close active tab
 *   Ctrl+Shift+W     → Close all tabs
 *   Ctrl+[           → Previous tab
 *   Ctrl+]           → Next tab
 *   Ctrl+K / Cmd+K   → Toggle command palette
 *   Ctrl+E           → Manage environments
 *   Ctrl+,           → Open settings
 *   Ctrl+I           → Import collection
 *   Ctrl+Shift+T     → Transform playground
 *   Ctrl+J           → Compare JSON
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const { openTab, closeTab, activeTabId, tabs, setActiveTab } = useTabsStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      // Ctrl-only shortcuts avoid conflicts with macOS browser Cmd shortcuts
      const isCtrlOnly = e.ctrlKey && !e.metaKey;

      switch (e.key.toLowerCase()) {
        case "enter":
          e.preventDefault();
          handlers.onSend?.();
          break;

        case "s":
          e.preventDefault();
          handlers.onSave?.();
          break;

        case "t":
          if (!isCtrlOnly) break;
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onTransformPlayground?.();
          } else {
            handlers.onNewRequest ? handlers.onNewRequest() : openTab();
          }
          break;

        case "n":
          if (!isCtrlOnly) break;
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onNewCollection?.();
          } else {
            handlers.onNewRequest ? handlers.onNewRequest() : openTab();
          }
          break;

        case "k":
          e.preventDefault();
          toggleCommandPalette();
          break;

        case "w":
          if (!isCtrlOnly) break;
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onCloseAllTabs?.();
          } else if (handlers.onCloseTab) {
            handlers.onCloseTab();
          } else if (activeTabId) {
            closeTab(activeTabId);
          }
          break;

        case "[": {
          if (!isCtrlOnly) break;
          e.preventDefault();
          const idx = tabs.findIndex((t) => t.tabId === activeTabId);
          if (idx > 0) setActiveTab(tabs[idx - 1].tabId);
          break;
        }

        case "]": {
          if (!isCtrlOnly) break;
          e.preventDefault();
          const idx = tabs.findIndex((t) => t.tabId === activeTabId);
          if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].tabId);
          break;
        }

        case "e":
          if (!isCtrlOnly) break;
          e.preventDefault();
          handlers.onManageEnvironments?.();
          break;

        case ",":
          if (!isCtrlOnly) break;
          e.preventDefault();
          handlers.onOpenSettings?.();
          break;

        case "i":
          if (!isCtrlOnly) break;
          e.preventDefault();
          handlers.onImportCollection?.();
          break;

        case "j":
          if (!isCtrlOnly) break;
          e.preventDefault();
          handlers.onCompareJson?.();
          break;
      }
    }

    // capture: true gives us priority over browser-level shortcuts (e.g. Cmd+W)
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [
    handlers,
    toggleCommandPalette,
    openTab,
    closeTab,
    activeTabId,
    tabs,
    setActiveTab,
  ]);
}
