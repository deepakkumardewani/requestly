"use client";

import { toast } from "sonner";
import { create } from "zustand";
import { getDB } from "@/lib/idb";
import { generateId } from "@/lib/utils";
import type {
  ChainEdge,
  ChainHistoryNode,
  StandaloneChain,
} from "@/types/chain";

type StandaloneChainState = {
  chains: Record<string, StandaloneChain>;
};

type StandaloneChainActions = {
  hydrate: () => Promise<void>;
  createChain: (name: string) => string;
  renameChain: (chainId: string, name: string) => void;
  deleteChain: (chainId: string) => void;
  addNode: (chainId: string, requestId: string) => void;
  removeNode: (chainId: string, requestId: string) => void;
  addHistoryNode: (chainId: string, node: ChainHistoryNode) => void;
  removeHistoryNode: (chainId: string, nodeId: string) => void;
  upsertEdge: (chainId: string, edge: ChainEdge) => void;
  deleteEdge: (chainId: string, edgeId: string) => void;
  updateNodePosition: (
    chainId: string,
    nodeId: string,
    pos: { x: number; y: number },
  ) => void;
  clearEdges: (chainId: string) => void;
};

async function persistChain(chain: StandaloneChain) {
  const db = getDB();
  if (!db) return;
  try {
    const instance = await db;
    await instance.put("chains", chain);
  } catch (error) {
    toast.error("Failed to save chain", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function deleteChainFromDB(chainId: string) {
  const db = getDB();
  if (!db) return;
  try {
    const instance = await db;
    await instance.delete("chains", chainId);
  } catch (error) {
    toast.error("Failed to delete chain", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function getOrCreate(
  chains: Record<string, StandaloneChain>,
  chainId: string,
): StandaloneChain {
  return (
    chains[chainId] ?? {
      id: chainId,
      name: "",
      createdAt: Date.now(),
      edges: [],
      nodePositions: {},
      nodeIds: [],
      historyNodes: [],
    }
  );
}

export const useStandaloneChainStore = create<
  StandaloneChainState & StandaloneChainActions
>((set) => ({
  chains: {},

  async hydrate() {
    const db = getDB();
    if (!db) return;
    try {
      const instance = await db;
      const all = await instance.getAll("chains");
      const map: Record<string, StandaloneChain> = {};
      for (const chain of all) {
        map[chain.id] = chain;
      }
      set({ chains: map });
    } catch (error) {
      toast.error("Failed to load chains", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  createChain(name) {
    const id = generateId();
    const chain: StandaloneChain = {
      id,
      name,
      createdAt: Date.now(),
      edges: [],
      nodePositions: {},
      nodeIds: [],
      historyNodes: [],
    };
    set((state) => ({ chains: { ...state.chains, [id]: chain } }));
    persistChain(chain);
    return id;
  },

  renameChain(chainId, name) {
    set((state) => {
      const chain = getOrCreate(state.chains, chainId);
      const updated = { ...chain, name };
      persistChain(updated);
      return { chains: { ...state.chains, [chainId]: updated } };
    });
  },

  deleteChain(chainId) {
    set((state) => {
      const updated = { ...state.chains };
      delete updated[chainId];
      return { chains: updated };
    });
    deleteChainFromDB(chainId);
  },

  addNode(chainId, requestId) {
    set((state) => {
      const chain = getOrCreate(state.chains, chainId);
      if (chain.nodeIds.includes(requestId)) return state;
      const updated = { ...chain, nodeIds: [...chain.nodeIds, requestId] };
      persistChain(updated);
      return { chains: { ...state.chains, [chainId]: updated } };
    });
  },

  removeNode(chainId, requestId) {
    set((state) => {
      const chain = getOrCreate(state.chains, chainId);
      const updated = {
        ...chain,
        nodeIds: chain.nodeIds.filter((id) => id !== requestId),
        edges: chain.edges.filter(
          (e) =>
            e.sourceRequestId !== requestId && e.targetRequestId !== requestId,
        ),
      };
      persistChain(updated);
      return { chains: { ...state.chains, [chainId]: updated } };
    });
  },

  addHistoryNode(chainId, node) {
    set((state) => {
      const chain = getOrCreate(state.chains, chainId);
      const updated = {
        ...chain,
        historyNodes: [...chain.historyNodes, node],
      };
      persistChain(updated);
      return { chains: { ...state.chains, [chainId]: updated } };
    });
  },

  removeHistoryNode(chainId, nodeId) {
    set((state) => {
      const chain = getOrCreate(state.chains, chainId);
      const updated = {
        ...chain,
        historyNodes: chain.historyNodes.filter((n) => n.id !== nodeId),
        edges: chain.edges.filter(
          (e) => e.sourceRequestId !== nodeId && e.targetRequestId !== nodeId,
        ),
      };
      persistChain(updated);
      return { chains: { ...state.chains, [chainId]: updated } };
    });
  },

  upsertEdge(chainId, edge) {
    set((state) => {
      const chain = getOrCreate(state.chains, chainId);
      const existingIdx = chain.edges.findIndex((e) => e.id === edge.id);
      const edges =
        existingIdx >= 0
          ? chain.edges.map((e) => (e.id === edge.id ? edge : e))
          : [...chain.edges, edge];
      const updated = { ...chain, edges };
      persistChain(updated);
      return { chains: { ...state.chains, [chainId]: updated } };
    });
  },

  deleteEdge(chainId, edgeId) {
    set((state) => {
      const chain = getOrCreate(state.chains, chainId);
      const updated = {
        ...chain,
        edges: chain.edges.filter((e) => e.id !== edgeId),
      };
      persistChain(updated);
      return { chains: { ...state.chains, [chainId]: updated } };
    });
  },

  updateNodePosition(chainId, nodeId, pos) {
    set((state) => {
      const chain = getOrCreate(state.chains, chainId);
      const updated = {
        ...chain,
        nodePositions: { ...chain.nodePositions, [nodeId]: pos },
      };
      persistChain(updated);
      return { chains: { ...state.chains, [chainId]: updated } };
    });
  },

  clearEdges(chainId) {
    set((state) => {
      const chain = getOrCreate(state.chains, chainId);
      const updated = { ...chain, edges: [] };
      persistChain(updated);
      return { chains: { ...state.chains, [chainId]: updated } };
    });
  },
}));
