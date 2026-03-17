"use client";

import { create } from "zustand";

type UIState = {
  leftPanelWidth: number;
  splitRatio: number;
  commandPaletteOpen: boolean;
  mobileSidebarOpen: boolean;
  historyFilter: string | null;
};

type UIActions = {
  setLeftPanelWidth: (width: number) => void;
  setSplitRatio: (ratio: number) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setHistoryFilter: (filter: string | null) => void;
};

export const useUIStore = create<UIState & UIActions>((set) => ({
  leftPanelWidth: 280,
  splitRatio: 50,
  commandPaletteOpen: false,
  mobileSidebarOpen: false,
  historyFilter: null,

  setLeftPanelWidth(width) {
    set({ leftPanelWidth: width });
  },

  setSplitRatio(ratio) {
    set({ splitRatio: ratio });
  },

  toggleCommandPalette() {
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen }));
  },

  setCommandPaletteOpen(open) {
    set({ commandPaletteOpen: open });
  },

  toggleMobileSidebar() {
    set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen }));
  },

  setHistoryFilter(filter) {
    set({ historyFilter: filter });
  },
}));
