"use client";

import { toast } from "sonner";
import { create } from "zustand";
import { getDB } from "@/lib/idb";
import type {
  ChainAssertion,
  ChainConfig,
  ChainEdge,
  ChainHistoryNode,
  ConditionNodeConfig,
  DelayNodeConfig,
  DisplayNodeConfig,
  EnvPromotion,
} from "@/types/chain";
import { migrateEdge } from "@/types/chain";

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
  updateHistoryNode: (
    collectionId: string,
    nodeId: string,
    patch: Partial<ChainHistoryNode>,
  ) => void;
  removeHistoryNode: (collectionId: string, nodeId: string) => void;
  upsertNodeAssertions: (
    collectionId: string,
    requestId: string,
    assertions: ChainAssertion[],
  ) => void;
  deleteNodeAssertions: (collectionId: string, requestId: string) => void;
  upsertDelayNode: (collectionId: string, node: DelayNodeConfig) => void;
  removeDelayNode: (collectionId: string, nodeId: string) => void;
  upsertConditionNode: (
    collectionId: string,
    node: ConditionNodeConfig,
  ) => void;
  removeConditionNode: (collectionId: string, nodeId: string) => void;
  upsertDisplayNode: (collectionId: string, node: DisplayNodeConfig) => void;
  removeDisplayNode: (collectionId: string, nodeId: string) => void;
  upsertEnvPromotion: (collectionId: string, promotion: EnvPromotion) => void;
  deleteEnvPromotion: (collectionId: string, edgeId: string) => void;
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
        const migrated = {
          ...config,
          edges: (config.edges ?? []).map(migrateEdge),
        };
        set((state) => ({
          configs: { ...state.configs, [collectionId]: migrated },
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

  updateHistoryNode(collectionId, nodeId, patch) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const updated = {
        ...config,
        historyNodes: (config.historyNodes ?? []).map((n) =>
          n.id === nodeId ? { ...n, ...patch } : n,
        ),
      };
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

  upsertDelayNode(collectionId, node) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const existing = config.delayNodes ?? [];
      const idx = existing.findIndex((n) => n.id === node.id);
      const delayNodes =
        idx >= 0
          ? existing.map((n) => (n.id === node.id ? node : n))
          : [...existing, node];
      const updated = { ...config, delayNodes };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  removeDelayNode(collectionId, nodeId) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const updated = {
        ...config,
        delayNodes: (config.delayNodes ?? []).filter((n) => n.id !== nodeId),
        edges: config.edges.filter(
          (e) => e.sourceRequestId !== nodeId && e.targetRequestId !== nodeId,
        ),
      };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  upsertConditionNode(collectionId, node) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const existing = config.conditionNodes ?? [];
      const idx = existing.findIndex((n) => n.id === node.id);
      const conditionNodes =
        idx >= 0
          ? existing.map((n) => (n.id === node.id ? node : n))
          : [...existing, node];
      const updated = { ...config, conditionNodes };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  removeConditionNode(collectionId, nodeId) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const updated = {
        ...config,
        conditionNodes: (config.conditionNodes ?? []).filter(
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

  upsertDisplayNode(collectionId, node) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const existing = config.displayNodes ?? [];
      const idx = existing.findIndex((n) => n.id === node.id);
      const displayNodes =
        idx >= 0
          ? existing.map((n) => (n.id === node.id ? node : n))
          : [...existing, node];
      const updated = { ...config, displayNodes };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  removeDisplayNode(collectionId, nodeId) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const updated = {
        ...config,
        displayNodes: (config.displayNodes ?? []).filter(
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

  upsertEnvPromotion(collectionId, promotion) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const existing = config.envPromotions ?? [];
      const idx = existing.findIndex((p) => p.edgeId === promotion.edgeId);
      const envPromotions =
        idx >= 0
          ? existing.map((p) => (p.edgeId === promotion.edgeId ? promotion : p))
          : [...existing, promotion];
      const updated = { ...config, envPromotions };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },

  deleteEnvPromotion(collectionId, edgeId) {
    set((state) => {
      const config = getOrCreateConfig(state.configs, collectionId);
      const updated = {
        ...config,
        envPromotions: (config.envPromotions ?? []).filter(
          (p) => p.edgeId !== edgeId,
        ),
      };
      persistConfig(updated);
      return { configs: { ...state.configs, [collectionId]: updated } };
    });
  },
}));
