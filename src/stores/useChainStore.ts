"use client";

import { toast } from "sonner";
import { create } from "zustand";
import { getDB } from "@/lib/idb";
import type {
  ChainAssertion,
  ChainConfig,
  ChainEdge,
  ChainHistoryNode,
} from "@/types/chain";

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
  /** One-time migration: sets nodeIds only when undefined. No-op if already set. */
  initNodeIds: (collectionId: string, requestIds: string[]) => void;
  addNode: (collectionId: string, requestId: string) => void;
  removeNode: (collectionId: string, requestId: string) => void;
  addHistoryNode: (collectionId: string, node: ChainHistoryNode) => void;
  removeHistoryNode: (collectionId: string, nodeId: string) => void;
  upsertNodeAssertions: (
    collectionId: string,
    requestId: string,
    assertions: ChainAssertion[],
  ) => void;
  deleteNodeAssertions: (collectionId: string, requestId: string) => void;
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

export const useChainStore = create<ChainState & ChainActions>((set) => ({
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

  initNodeIds(collectionId, requestIds) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      if (config.nodeIds !== undefined) return state; // already initialized
      const updated = { ...config, nodeIds: requestIds };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  addNode(collectionId, requestId) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const nodeIds = config.nodeIds ?? [];
      if (nodeIds.includes(requestId)) return state; // deduplicate
      const updated = { ...config, nodeIds: [...nodeIds, requestId] };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  removeNode(collectionId, requestId) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const updated = {
        ...config,
        nodeIds: (config.nodeIds ?? []).filter((id) => id !== requestId),
        // Remove orphaned edges referencing this node
        edges: config.edges.filter(
          (e) =>
            e.sourceRequestId !== requestId && e.targetRequestId !== requestId,
        ),
      };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  addHistoryNode(collectionId, node) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const historyNodes = config.historyNodes ?? [];
      const updated = { ...config, historyNodes: [...historyNodes, node] };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  removeHistoryNode(collectionId, nodeId) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const updated = {
        ...config,
        historyNodes: (config.historyNodes ?? []).filter(
          (n) => n.id !== nodeId,
        ),
        edges: config.edges.filter(
          (e) => e.sourceRequestId !== nodeId && e.targetRequestId !== nodeId,
        ),
      };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  upsertNodeAssertions(collectionId, requestId, assertions) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const updated = {
        ...config,
        nodeAssertions: {
          ...(config.nodeAssertions ?? {}),
          [requestId]: assertions,
        },
      };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  deleteNodeAssertions(collectionId, requestId) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const nodeAssertions = { ...(config.nodeAssertions ?? {}) };
      delete nodeAssertions[requestId];
      const updated = { ...config, nodeAssertions };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },
}));
