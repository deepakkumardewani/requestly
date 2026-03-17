"use client";

import { create } from "zustand";
import { toast } from "sonner";
import type { AppSettings } from "@/types";
import { getDB } from "@/lib/idb";

type SettingsState = AppSettings & {
  hydrated: boolean;
};

type SettingsActions = {
  setSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
  hydrate: () => Promise<void>;
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  proxyUrl: "",
  sslVerify: true,
  followRedirects: true,
  showHealthMonitor: true,
};

async function persistSettings(settings: AppSettings) {
  const db = getDB();
  if (!db) return;
  try {
    const instance = await db;
    await instance.put("settings", settings, "app");
  } catch (error) {
    toast.error("Failed to save settings", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export const useSettingsStore = create<SettingsState & SettingsActions>(
  (set, get) => ({
    ...DEFAULT_SETTINGS,
    hydrated: false,

    setSetting(key, value) {
      set({ [key]: value });
      const {
        hydrated: _hydrated,
        setSetting: _setSetting,
        hydrate: _hydrate,
        ...settings
      } = get() as SettingsState & SettingsActions;
      persistSettings(settings);
    },

    async hydrate() {
      const db = getDB();
      if (!db) return;
      try {
        const instance = await db;
        const saved = await instance.get("settings", "app");
        if (saved) {
          set({ ...saved, hydrated: true });
        } else {
          set({ hydrated: true });
        }
      } catch (error) {
        toast.error("Failed to load settings", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        set({ hydrated: true });
      }
    },
  }),
);
