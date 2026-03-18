"use client";

import { toast } from "sonner";
import { create } from "zustand";
import { getDB } from "@/lib/idb";
import { generateId } from "@/lib/utils";
import type { AuthConfig, BodyConfig, HttpMethod, TabState } from "@/types";

type TabsState = {
  tabs: TabState[];
  activeTabId: string | null;
};

type TabsActions = {
  openTab: (initial?: Partial<TabState>) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (tabId: string) => void;
  updateTabState: (tabId: string, patch: Partial<TabState>) => void;
  hydrate: () => Promise<void>;
};

const DEFAULT_AUTH: AuthConfig = { type: "none" };
const DEFAULT_BODY: BodyConfig = { type: "none", content: "" };

function createEmptyTab(overrides: Partial<TabState> = {}): TabState {
  return {
    tabId: generateId(),
    requestId: null,
    name: "New Request",
    isDirty: false,
    method: "GET" as HttpMethod,
    url: "",
    params: [],
    headers: [],
    auth: DEFAULT_AUTH,
    body: DEFAULT_BODY,
    preScript: "",
    postScript: "",
    ...overrides,
  };
}

async function persistTabs(tabs: TabState[]) {
  const db = getDB();
  if (!db) return;
  try {
    const instance = await db;
    const tx = instance.transaction("tabs", "readwrite");
    await tx.store.clear();
    for (const tab of tabs) {
      await tx.store.put(tab);
    }
    await tx.done;
  } catch (error) {
    toast.error("Failed to save tabs", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export const useTabsStore = create<TabsState & TabsActions>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab(initial) {
    const newTab = createEmptyTab(initial);
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.tabId,
    }));
    persistTabs(get().tabs);
  },

  closeTab(tabId) {
    const { tabs, activeTabId } = get();
    const idx = tabs.findIndex((t) => t.tabId === tabId);
    const remaining = tabs.filter((t) => t.tabId !== tabId);

    let nextActiveId: string | null = activeTabId;
    if (activeTabId === tabId) {
      nextActiveId = remaining[idx]?.tabId ?? remaining[idx - 1]?.tabId ?? null;
    }

    if (remaining.length === 0) {
      const emptyTab = createEmptyTab();
      set({ tabs: [emptyTab], activeTabId: emptyTab.tabId });
      persistTabs([emptyTab]);
      return;
    }

    set({ tabs: remaining, activeTabId: nextActiveId });
    persistTabs(remaining);
  },

  closeOtherTabs(tabId) {
    const { tabs } = get();
    const kept = tabs.filter((t) => t.tabId === tabId);
    // kept should have exactly one tab; if the target was removed somehow, keep empty
    const remaining = kept.length > 0 ? kept : [createEmptyTab()];
    set({ tabs: remaining, activeTabId: remaining[0].tabId });
    persistTabs(remaining);
  },

  closeAllTabs() {
    const emptyTab = createEmptyTab();
    set({ tabs: [emptyTab], activeTabId: emptyTab.tabId });
    persistTabs([emptyTab]);
  },

  setActiveTab(tabId) {
    set({ activeTabId: tabId });
  },

  updateTabState(tabId, patch) {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.tabId === tabId ? { ...t, ...patch, isDirty: true } : t,
      ),
    }));
    persistTabs(get().tabs);
  },

  async hydrate() {
    const db = getDB();
    if (!db) return;
    try {
      const instance = await db;
      const saved = await instance.getAll("tabs");
      if (saved.length > 0) {
        set({ tabs: saved, activeTabId: saved[0].tabId });
      } else {
        const emptyTab = createEmptyTab();
        set({ tabs: [emptyTab], activeTabId: emptyTab.tabId });
        persistTabs([emptyTab]);
      }
    } catch (error) {
      toast.error("Failed to load tabs", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      const emptyTab = createEmptyTab();
      set({ tabs: [emptyTab], activeTabId: emptyTab.tabId });
    }
  },
}));
