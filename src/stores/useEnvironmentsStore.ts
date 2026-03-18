"use client";

import { toast } from "sonner";
import { create } from "zustand";
import { getDB } from "@/lib/idb";
import { generateId, interpolateVariables } from "@/lib/utils";
import type { EnvironmentModel, EnvVariable } from "@/types";

const ACTIVE_ENV_STORAGE_KEY = "requestly_active_env_id";

type EnvironmentsState = {
  environments: EnvironmentModel[];
  activeEnvId: string | null;
};

type EnvironmentsActions = {
  createEnv: (name: string) => EnvironmentModel;
  updateEnv: (id: string, patch: Partial<EnvironmentModel>) => void;
  deleteEnv: (id: string) => void;
  setActiveEnv: (id: string | null) => void;
  resolveVariables: (template: string) => string;
  hydrate: () => Promise<void>;
};

async function persistEnv(env: EnvironmentModel) {
  const db = getDB();
  if (!db) return;
  try {
    const instance = await db;
    await instance.put("environments", env);
  } catch (error) {
    toast.error("Failed to save environment", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function deleteEnvFromDB(id: string) {
  const db = getDB();
  if (!db) return;
  try {
    const instance = await db;
    await instance.delete("environments", id);
  } catch (error) {
    toast.error("Failed to delete environment", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export const useEnvironmentsStore = create<
  EnvironmentsState & EnvironmentsActions
>((set, get) => ({
  environments: [],
  activeEnvId: null,

  createEnv(name) {
    const env: EnvironmentModel = {
      id: generateId(),
      name,
      variables: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ environments: [...state.environments, env] }));
    persistEnv(env);
    return env;
  },

  updateEnv(id, patch) {
    set((state) => ({
      environments: state.environments.map((e) =>
        e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e,
      ),
    }));
    const updated = get().environments.find((e) => e.id === id);
    if (updated) persistEnv(updated);
  },

  deleteEnv(id) {
    set((state) => ({
      environments: state.environments.filter((e) => e.id !== id),
      activeEnvId: state.activeEnvId === id ? null : state.activeEnvId,
    }));
    deleteEnvFromDB(id);
  },

  setActiveEnv(id) {
    set({ activeEnvId: id });
    if (id === null) {
      localStorage.removeItem(ACTIVE_ENV_STORAGE_KEY);
    } else {
      localStorage.setItem(ACTIVE_ENV_STORAGE_KEY, id);
    }
  },

  resolveVariables(template) {
    const { environments, activeEnvId } = get();
    const activeEnv = environments.find((e) => e.id === activeEnvId);
    if (!activeEnv) return template;

    const envMap = activeEnv.variables.reduce<Record<string, string>>(
      (acc, v) => {
        // Use currentValue if set, else fall back to initialValue
        acc[v.key] = v.currentValue || v.initialValue;
        return acc;
      },
      {},
    );

    return interpolateVariables(template, envMap);
  },

  async hydrate() {
    const db = getDB();
    if (!db) return;
    try {
      const instance = await db;
      const environments = await instance.getAll("environments");
      const storedEnvId = localStorage.getItem(ACTIVE_ENV_STORAGE_KEY);
      // Only restore if the stored env still exists
      const activeEnvId =
        storedEnvId && environments.some((e) => e.id === storedEnvId)
          ? storedEnvId
          : null;
      set({ environments, activeEnvId });
    } catch (error) {
      toast.error("Failed to load environments", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
}));
