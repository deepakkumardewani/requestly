"use client";

import { create } from "zustand";
import { toast } from "sonner";
import type { HistoryEntry, HealthMetrics } from "@/types";
import { MAX_HISTORY_ENTRIES } from "@/lib/constants";
import { getDB } from "@/lib/idb";
import {
  healthKey,
  getEntriesForKey,
  computeHealthMetrics,
} from "@/lib/healthMonitor";

type HistoryState = {
  entries: HistoryEntry[];
};

type HistoryActions = {
  addEntry: (entry: HistoryEntry) => void;
  deleteEntry: (id: string) => void;
  clearHistory: () => void;
  hydrate: () => Promise<void>;
  getMetricsForKey: (method: string, url: string) => HealthMetrics | null;
  getRecentTimesForKey: (
    method: string,
    url: string,
    limit: number,
  ) => number[];
};

async function persistEntry(entry: HistoryEntry) {
  const db = getDB();
  if (!db) return;
  try {
    const instance = await db;
    await instance.put("history", entry);
  } catch (error) {
    toast.error("Failed to save history entry", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function deleteEntryFromDB(id: string) {
  const db = getDB();
  if (!db) return;
  try {
    const instance = await db;
    await instance.delete("history", id);
  } catch (error) {
    toast.error("Failed to delete history entry", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function clearHistoryFromDB() {
  const db = getDB();
  if (!db) return;
  try {
    const instance = await db;
    await instance.clear("history");
  } catch (error) {
    toast.error("Failed to clear history", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export const useHistoryStore = create<HistoryState & HistoryActions>(
  (set, get) => ({
    entries: [],

    addEntry(entry) {
      set((state) => {
        const updated = [entry, ...state.entries];
        // Trim excess entries (oldest are at the end)
        const trimmed = updated.slice(0, MAX_HISTORY_ENTRIES);

        // Delete trimmed entries from DB
        const removed = updated.slice(MAX_HISTORY_ENTRIES);
        for (const e of removed) {
          deleteEntryFromDB(e.id);
        }

        return { entries: trimmed };
      });
      persistEntry(entry);
    },

    deleteEntry(id) {
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
      }));
      deleteEntryFromDB(id);
    },

    clearHistory() {
      set({ entries: [] });
      clearHistoryFromDB();
    },

    getMetricsForKey(method, url) {
      const key = healthKey(method, url);
      const matched = getEntriesForKey(get().entries, key);
      return computeHealthMetrics(matched);
    },

    getRecentTimesForKey(method, url, limit) {
      const key = healthKey(method, url);
      return getEntriesForKey(get().entries, key)
        .slice(0, limit)
        .map((e) => e.duration);
    },

    async hydrate() {
      const db = getDB();
      if (!db) return;
      try {
        const instance = await db;
        const entries = await instance.getAllFromIndex(
          "history",
          "by-timestamp",
        );
        // Sort newest first
        set({ entries: entries.reverse() });
      } catch (error) {
        toast.error("Failed to load history", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  }),
);
