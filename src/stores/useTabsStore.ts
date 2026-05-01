"use client";

import { toast } from "sonner";
import { create } from "zustand";
import { getDB } from "@/lib/idb";
import { generateId } from "@/lib/utils";
import type {
  AuthConfig,
  BodyConfig,
  HttpMethod,
  HttpTab,
  TabState,
} from "@/types";

type TabsState = {
  tabs: TabState[];
  activeTabId: string | null;
};

type TabsActions = {
  openTab: (initial?: Partial<TabState>) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  closeTabsForRequest: (requestId: string) => void;
  closeTabsForRequests: (requestIds: string[]) => void;
  setActiveTab: (tabId: string) => void;
  updateTabState: (tabId: string, patch: Partial<TabState>) => void;
  hydrate: () => Promise<void>;
};

const DEFAULT_AUTH: AuthConfig = { type: "none" };
const DEFAULT_BODY: BodyConfig = { type: "none", content: "" };

function normalizePersistedTab(raw: TabState): TabState {
  if (
    raw.type === "http" ||
    raw.type === "graphql" ||
    raw.type === "websocket" ||
    raw.type === "socketio"
  ) {
    return raw;
  }
  const legacy = raw as Omit<HttpTab, "type">;
  return {
    tabId: legacy.tabId,
    requestId: legacy.requestId,
    name: legacy.name,
    isDirty: legacy.isDirty,
    type: "http",
    url: legacy.url,
    headers: legacy.headers ?? [],
    method: legacy.method ?? "GET",
    params: legacy.params ?? [],
    auth: legacy.auth ?? DEFAULT_AUTH,
    body: legacy.body ?? DEFAULT_BODY,
    preScript: legacy.preScript ?? "",
    postScript: legacy.postScript ?? "",
    timeoutMs: (legacy as HttpTab).timeoutMs,
  };
}

function createEmptyTab(overrides: Partial<TabState> = {}): TabState {
  const tabId = generateId();
  const requestId = overrides.requestId ?? null;

  switch (overrides.type) {
    case "graphql":
      return {
        name: "New GraphQL",
        isDirty: false,
        url: "",
        headers: [],
        query: "",
        variables: "{}",
        operationName: "",
        auth: DEFAULT_AUTH,
        ...overrides,
        tabId,
        requestId: overrides.requestId ?? requestId,
        type: "graphql",
      };
    case "websocket":
      return {
        name: "New WebSocket",
        isDirty: false,
        url: "wss://",
        headers: [],
        messageLog: [],
        ...overrides,
        tabId,
        requestId: overrides.requestId ?? requestId,
        type: "websocket",
      };
    case "socketio":
      return {
        name: "New Socket.IO",
        isDirty: false,
        url: "http://",
        headers: [],
        messageLog: [],
        ...overrides,
        tabId,
        requestId: overrides.requestId ?? requestId,
        type: "socketio",
      };
    default:
      return {
        name: "New Request",
        isDirty: false,
        url: "",
        headers: [],
        method: "GET" as HttpMethod,
        params: [],
        auth: DEFAULT_AUTH,
        body: DEFAULT_BODY,
        preScript: "",
        postScript: "",
        ...overrides,
        tabId,
        requestId: overrides.requestId ?? requestId,
        type: "http",
      };
  }
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
      set({ tabs: [], activeTabId: null });
      persistTabs([]);
      return;
    }

    set({ tabs: remaining, activeTabId: nextActiveId });
    persistTabs(remaining);
  },

  closeOtherTabs(tabId) {
    const { tabs } = get();
    const remaining = tabs.filter((t) => t.tabId === tabId);
    const nextActiveId = remaining[0]?.tabId ?? null;
    set({ tabs: remaining, activeTabId: nextActiveId });
    persistTabs(remaining);
  },

  closeAllTabs() {
    set({ tabs: [], activeTabId: null });
    persistTabs([]);
  },

  closeTabsForRequest(requestId) {
    const { tabs, activeTabId } = get();
    const remaining = tabs.filter((t) => t.requestId !== requestId);
    const nextActiveId =
      remaining.find((t) => t.tabId === activeTabId)?.tabId ??
      remaining[0]?.tabId ??
      null;
    set({ tabs: remaining, activeTabId: nextActiveId });
    persistTabs(remaining);
  },

  closeTabsForRequests(requestIds) {
    const idSet = new Set(requestIds);
    const { tabs, activeTabId } = get();
    const remaining = tabs.filter(
      (t) => !t.requestId || !idSet.has(t.requestId),
    );
    const nextActiveId =
      remaining.find((t) => t.tabId === activeTabId)?.tabId ??
      remaining[0]?.tabId ??
      null;
    set({ tabs: remaining, activeTabId: nextActiveId });
    persistTabs(remaining);
  },

  setActiveTab(tabId) {
    set({ activeTabId: tabId });
  },

  updateTabState(tabId, patch) {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.tabId === tabId ? ({ ...t, isDirty: true, ...patch } as TabState) : t,
      ),
    }));
    // No persistence here — tabs are only written to DB on explicit Save
    // (and on open/close to maintain the tab list across reloads).
  },

  async hydrate() {
    const db = getDB();
    if (!db) return;
    try {
      const instance = await db;
      const saved = await instance.getAll("tabs");
      if (saved.length > 0) {
        const tabs = saved.map((t) => normalizePersistedTab(t as TabState));
        set({ tabs, activeTabId: tabs[0].tabId });
      } else {
        set({ tabs: [], activeTabId: null });
      }
    } catch (error) {
      toast.error("Failed to load tabs", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      set({ tabs: [], activeTabId: null });
    }
  },
}));
