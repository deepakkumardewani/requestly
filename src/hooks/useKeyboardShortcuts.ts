"use client";

import { useEffect } from "react";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";

type ShortcutHandlers = {
  onSend?: () => void;
  onSave?: () => void;
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

      switch (e.key.toLowerCase()) {
        case "enter":
          e.preventDefault();
          handlers.onSend?.();
          break;
        case "s":
          e.preventDefault();
          handlers.onSave?.();
          break;
        case "n":
          e.preventDefault();
          openTab();
          break;
        case "k":
          e.preventDefault();
          toggleCommandPalette();
          break;
        case "w":
          e.preventDefault();
          if (activeTabId) closeTab(activeTabId);
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers, toggleCommandPalette, openTab, closeTab, activeTabId]);
}
