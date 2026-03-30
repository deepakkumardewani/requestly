"use client";

import { toast } from "sonner";
import { create } from "zustand";
import { getDB } from "@/lib/idb";
import { generateId } from "@/lib/utils";
import type { ChainConfig, ChainEdge } from "@/types/chain";

type ChainState = {
  configs: Record<string, ChainConfig>;
};

type ChainActions = {
  loadConfig: (collectionId: string) => Promise<void>;
  upsertEdge: (collectionId: string, edge: ChainEdge) => void;
  deleteEdge: (collectionId: string, edgeId: string) => void;
  updateNodePosition: (
    collectionId: string,
    requestId: string,
    pos: { x: number; y: number },
  ) => void;
  clearEdges: (collectionId: string) => void;
};

function getOrCreateConfig(
  configs: Record<string, ChainConfig>,
  collectionId: string,
): ChainConfig {
  return (
    configs[collectionId] ?? {
      collectionId,
      edges: [],
      nodePositions: {},
    }
  );
}

async function persistConfig(config: ChainConfig) {
  const db = getDB();
  if (!db) return;
  try {
    const instance = await db;
    await instance.put("chainConfigs", config);
  } catch (error) {
    toast.error("Failed to save chain config", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export const useChainStore = create<ChainState & ChainActions>((set, get) => ({
  configs: {},

  async loadConfig(collectionId) {
    const db = getDB();
    if (!db) return;
    try {
      const instance = await db;
      const config = await instance.get("chainConfigs", collectionId);
      if (config) {
        set((state) => ({
          configs: { ...state.configs, [collectionId]: config },
        }));
      } else {
        // Init empty config
        set((state) => ({
          configs: {
            ...state.configs,
            [collectionId]: {
              collectionId,
              edges: [],
              nodePositions: {},
            },
          },
        }));
      }
    } catch (error) {
      toast.error("Failed to load chain config", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  upsertEdge(collectionId, edge) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const existingIdx = config.edges.findIndex((e) => e.id === edge.id);
      const edges =
        existingIdx >= 0
          ? config.edges.map((e) => (e.id === edge.id ? edge : e))
          : [...config.edges, edge];
      const updated = { ...config, edges };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  deleteEdge(collectionId, edgeId) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const updated = {
        ...config,
        edges: config.edges.filter((e) => e.id !== edgeId),
      };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  updateNodePosition(collectionId, requestId, pos) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const updated = {
        ...config,
        nodePositions: { ...config.nodePositions, [requestId]: pos },
      };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  clearEdges(collectionId) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const updated = { ...config, edges: [] };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },
}));
