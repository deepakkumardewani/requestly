import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDB } from "@/lib/idb";
import type {
  ChainAssertion,
  ChainEdge,
  ChainHistoryNode,
  ConditionNodeConfig,
  DelayNodeConfig,
  DisplayNodeConfig,
  EnvPromotion,
} from "@/types/chain";
import { useStandaloneChainStore } from "./useStandaloneChainStore";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(),
}));

function edge(id: string, src: string, tgt: string): ChainEdge {
  return {
    id,
    sourceRequestId: src,
    targetRequestId: tgt,
    injections: [{ sourceJsonPath: "$", targetField: "body", targetKey: "k" }],
  };
}

describe("useStandaloneChainStore", () => {
  beforeEach(() => {
    useStandaloneChainStore.setState({ chains: {} });
    vi.mocked(getDB).mockReturnValue(null);
    vi.clearAllMocks();
  });

  it("createChain returns id and persists structure", () => {
    const id = useStandaloneChainStore.getState().createChain("Alpha");
    const ch = useStandaloneChainStore.getState().chains[id];
    expect(ch.name).toBe("Alpha");
    expect(ch.nodeIds).toEqual([]);
    expect(ch.edges).toEqual([]);
  });

  it("renameChain updates name", () => {
    const id = useStandaloneChainStore.getState().createChain("A");
    useStandaloneChainStore.getState().renameChain(id, "B");
    expect(useStandaloneChainStore.getState().chains[id].name).toBe("B");
  });

  it("deleteChain removes entry", () => {
    const id = useStandaloneChainStore.getState().createChain("A");
    useStandaloneChainStore.getState().deleteChain(id);
    expect(useStandaloneChainStore.getState().chains[id]).toBeUndefined();
  });

  it("hydrate migrates edges and maps by id", async () => {
    const chain = {
      id: "c1",
      name: "C",
      createdAt: 1,
      edges: [
        {
          id: "e1",
          sourceRequestId: "a",
          targetRequestId: "b",
          sourceJsonPath: "$.z",
          targetField: "header",
          targetKey: "h",
        },
      ],
      nodePositions: {},
      nodeIds: [] as string[],
      historyNodes: [] as ChainHistoryNode[],
    };
    const db = {
      getAll: vi.fn(async () => [chain]),
    };
    vi.mocked(getDB).mockReturnValue(Promise.resolve(db as never));

    await useStandaloneChainStore.getState().hydrate();

    const out = useStandaloneChainStore.getState().chains.c1;
    expect(out.edges[0].injections[0].sourceJsonPath).toBe("$.z");
  });

  it("hydrate toast on failure", async () => {
    const db = {
      getAll: vi.fn().mockRejectedValue(new Error("x")),
    };
    vi.mocked(getDB).mockReturnValue(Promise.resolve(db as never));

    await useStandaloneChainStore.getState().hydrate();

    expect(toast.error).toHaveBeenCalledWith("Failed to load chains", {
      description: "x",
    });
  });

  it("addNode dedupes and removeNode trims edges", () => {
    const id = useStandaloneChainStore.getState().createChain("C");
    useStandaloneChainStore.getState().addNode(id, "r1");
    useStandaloneChainStore.getState().addNode(id, "r1");
    useStandaloneChainStore.getState().upsertEdge(id, edge("e1", "r1", "x"));
    useStandaloneChainStore.getState().removeNode(id, "r1");
    expect(useStandaloneChainStore.getState().chains[id].nodeIds).toEqual([]);
    expect(useStandaloneChainStore.getState().chains[id].edges).toEqual([]);
  });

  it("history node CRUD and edge cleanup", () => {
    const id = useStandaloneChainStore.getState().createChain("C");
    const hn: ChainHistoryNode = {
      id: "h1",
      historyEntryId: "he",
      name: "n",
      method: "GET",
      url: "/",
      params: [],
      headers: [],
      auth: { type: "none" },
      body: { type: "none", content: "" },
    };
    useStandaloneChainStore.getState().addHistoryNode(id, hn);
    useStandaloneChainStore.getState().updateHistoryNode(id, "h1", {
      name: "z",
    });
    expect(
      useStandaloneChainStore.getState().chains[id].historyNodes[0].name,
    ).toBe("z");
    useStandaloneChainStore.getState().upsertEdge(id, edge("e1", "h1", "t"));
    useStandaloneChainStore.getState().removeHistoryNode(id, "h1");
    expect(
      useStandaloneChainStore.getState().chains[id].historyNodes,
    ).toHaveLength(0);
    expect(useStandaloneChainStore.getState().chains[id].edges).toHaveLength(0);
  });

  it("edge upsert delete and node position and clearEdges", () => {
    const id = useStandaloneChainStore.getState().createChain("C");
    useStandaloneChainStore.getState().upsertEdge(id, edge("e1", "a", "b"));
    useStandaloneChainStore.getState().updateNodePosition(id, "a", {
      x: 3,
      y: 4,
    });
    useStandaloneChainStore.getState().deleteEdge(id, "e1");
    useStandaloneChainStore.getState().upsertEdge(id, edge("e2", "a", "b"));
    useStandaloneChainStore.getState().clearEdges(id);
    expect(useStandaloneChainStore.getState().chains[id].edges).toEqual([]);
    expect(
      useStandaloneChainStore.getState().chains[id].nodePositions.a,
    ).toEqual({ x: 3, y: 4 });
  });

  it("assertions upsert and delete", () => {
    const id = useStandaloneChainStore.getState().createChain("C");
    const assertions: ChainAssertion[] = [
      {
        id: "a1",
        source: "status",
        operator: "exists",
        enabled: true,
      },
    ];
    useStandaloneChainStore
      .getState()
      .upsertNodeAssertions(id, "r1", assertions);
    useStandaloneChainStore.getState().deleteNodeAssertions(id, "r1");
    expect(
      useStandaloneChainStore.getState().chains[id].nodeAssertions?.r1,
    ).toBeUndefined();
  });

  it("delay condition display env promotion lifecycle", () => {
    const id = useStandaloneChainStore.getState().createChain("C");
    const delay: DelayNodeConfig = { id: "d1", type: "delay", delayMs: 1 };
    useStandaloneChainStore.getState().upsertDelayNode(id, delay);
    useStandaloneChainStore.getState().upsertEdge(id, edge("e1", "d1", "z"));
    useStandaloneChainStore.getState().removeDelayNode(id, "d1");

    const cond: ConditionNodeConfig = {
      id: "c1",
      type: "condition",
      variable: "v",
      branches: [],
    };
    useStandaloneChainStore.getState().upsertConditionNode(id, cond);
    useStandaloneChainStore.getState().upsertEdge(id, edge("e2", "c1", "z"));
    useStandaloneChainStore.getState().removeConditionNode(id, "c1");

    const disp: DisplayNodeConfig = {
      id: "p1",
      type: "display",
      sourceJsonPath: "$",
      targetField: "url",
      targetKey: "u",
    };
    useStandaloneChainStore.getState().upsertDisplayNode(id, disp);
    useStandaloneChainStore.getState().upsertEdge(id, edge("e3", "p1", "z"));
    useStandaloneChainStore.getState().removeDisplayNode(id, "p1");

    const promo: EnvPromotion = {
      edgeId: "px",
      envId: "env",
      envVarName: "V",
    };
    useStandaloneChainStore.getState().upsertEnvPromotion(id, promo);
    useStandaloneChainStore.getState().deleteEnvPromotion(id, "px");

    const ch = useStandaloneChainStore.getState().chains[id];
    expect(ch.delayNodes?.length ?? 0).toBe(0);
    expect(ch.conditionNodes?.length ?? 0).toBe(0);
    expect(ch.displayNodes?.length ?? 0).toBe(0);
    expect(ch.envPromotions?.length ?? 0).toBe(0);
    expect(ch.edges.length).toBe(0);
  });

  it("persist failure toast on save", async () => {
    const db = {
      put: vi.fn().mockRejectedValue(new Error("save")),
    };
    vi.mocked(getDB).mockReturnValue(Promise.resolve(db as never));

    useStandaloneChainStore.getState().createChain("Z");

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to save chain", {
        description: "save",
      }),
    );
  });
});
