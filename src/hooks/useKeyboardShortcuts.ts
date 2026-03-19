"use client";

import { useEffect } from "react";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";

type ShortcutHandlers = {
  onSend?: () => void;
  onSave?: () => void;
  onCloseTab?: () => void;
  onNewCollection?: () => void;
};

/**
 * Attaches global keyboard shortcuts to window.
 * Call from the component that owns the send/save handlers.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const { openTab, closeTab, activeTabId } = useTabsStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      // Ctrl-only shortcuts (must not conflict with browser Cmd shortcuts on Mac)
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
          openTab();
          break;
        case "n":
          if (!isCtrlOnly) break;
          e.preventDefault();
          handlers.onNewCollection?.();
          break;
        case "k":
          e.preventDefault();
          toggleCommandPalette();
          break;
        case "w":
          if (!isCtrlOnly) break;
          e.preventDefault();
          if (handlers.onCloseTab) {
            handlers.onCloseTab();
          } else if (activeTabId) {
            closeTab(activeTabId);
          }
          break;
      }
    }

    // capture: true gives us priority over browser-level shortcuts (e.g. Cmd+W)
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [handlers, toggleCommandPalette, openTab, closeTab, activeTabId]);
}
