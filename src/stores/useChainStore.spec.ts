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
import { useChainStore } from "./useChainStore";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(),
}));

const COL = "col-1";

function edge(id: string, src: string, tgt: string): ChainEdge {
  return {
    id,
    sourceRequestId: src,
    targetRequestId: tgt,
    injections: [
      {
        sourceJsonPath: "$.a",
        targetField: "header",
        targetKey: "X",
      },
    ],
  };
}

describe("useChainStore", () => {
  beforeEach(() => {
    useChainStore.setState({ configs: {} });
    vi.mocked(getDB).mockReturnValue(null);
    vi.clearAllMocks();
  });

  it("loadConfig seeds empty config when db misses key", async () => {
    const db = {
      get: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(getDB).mockReturnValue(Promise.resolve(db as never));

    await useChainStore.getState().loadConfig(COL);

    const cfg = useChainStore.getState().configs[COL];
    expect(cfg.collectionId).toBe(COL);
    expect(cfg.edges).toEqual([]);
    expect(cfg.nodePositions).toEqual({});
  });

  it("loadConfig migrates legacy edge shape", async () => {
    const raw = {
      collectionId: COL,
      edges: [
        {
          id: "e1",
          sourceRequestId: "a",
          targetRequestId: "b",
          sourceJsonPath: "$.x",
          targetField: "body",
          targetKey: "k",
        },
      ],
      nodePositions: {},
    };
    const db = { get: vi.fn().mockResolvedValue(raw) };
    vi.mocked(getDB).mockReturnValue(Promise.resolve(db as never));

    await useChainStore.getState().loadConfig(COL);

    const e = useChainStore.getState().configs[COL].edges[0];
    expect(e.injections).toHaveLength(1);
    expect(e.injections[0].sourceJsonPath).toBe("$.x");
  });

  it("loadConfig toast on error", async () => {
    const db = { get: vi.fn().mockRejectedValue(new Error("bad")) };
    vi.mocked(getDB).mockReturnValue(Promise.resolve(db as never));

    await useChainStore.getState().loadConfig(COL);

    expect(toast.error).toHaveBeenCalledWith("Failed to load chain config", {
      description: "bad",
    });
  });

  it("upsertEdge appends then replaces by id", () => {
    useChainStore.getState().upsertEdge(COL, edge("e1", "a", "b"));
    expect(useChainStore.getState().configs[COL].edges).toHaveLength(1);
    const next = edge("e1", "a", "c");
    useChainStore.getState().upsertEdge(COL, next);
    expect(useChainStore.getState().configs[COL].edges[0].targetRequestId).toBe(
      "c",
    );
  });

  it("deleteEdge filters edge", () => {
    useChainStore.getState().upsertEdge(COL, edge("e1", "a", "b"));
    useChainStore.getState().deleteEdge(COL, "e1");
    expect(useChainStore.getState().configs[COL].edges).toHaveLength(0);
  });

  it("updateNodePosition stores coordinates", () => {
    useChainStore.getState().updateNodePosition(COL, "n1", { x: 1, y: 2 });
    expect(useChainStore.getState().configs[COL].nodePositions.n1).toEqual({
      x: 1,
      y: 2,
    });
  });

  it("clearEdges empties edges", () => {
    useChainStore.getState().upsertEdge(COL, edge("e1", "a", "b"));
    useChainStore.getState().clearEdges(COL);
    expect(useChainStore.getState().configs[COL].edges).toEqual([]);
  });

  it("initNodeIds sets once", () => {
    useChainStore.getState().initNodeIds(COL, ["a", "b"]);
    expect(useChainStore.getState().configs[COL].nodeIds).toEqual(["a", "b"]);
    useChainStore.getState().initNodeIds(COL, ["c"]);
    expect(useChainStore.getState().configs[COL].nodeIds).toEqual(["a", "b"]);
  });

  it("addNode deduplicates", () => {
    useChainStore.getState().addNode(COL, "r1");
    useChainStore.getState().addNode(COL, "r1");
    expect(useChainStore.getState().configs[COL].nodeIds).toEqual(["r1"]);
  });

  it("removeNode drops edges touching node", () => {
    useChainStore.getState().upsertEdge(COL, edge("e1", "a", "b"));
    useChainStore.getState().removeNode(COL, "a");
    expect(useChainStore.getState().configs[COL].edges).toHaveLength(0);
    expect(useChainStore.getState().configs[COL].nodeIds).not.toContain("a");
  });

  it("addHistoryNode appends", () => {
    const node: ChainHistoryNode = {
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
    useChainStore.getState().addHistoryNode(COL, node);
    expect(useChainStore.getState().configs[COL].historyNodes).toEqual([node]);
  });

  it("updateHistoryNode patches node", () => {
    const node: ChainHistoryNode = {
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
    useChainStore.getState().addHistoryNode(COL, node);
    useChainStore.getState().updateHistoryNode(COL, "h1", { name: "x" });
    expect(useChainStore.getState().configs[COL].historyNodes![0].name).toBe(
      "x",
    );
  });

  it("removeHistoryNode removes edges referencing id", () => {
    const node: ChainHistoryNode = {
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
    useChainStore.getState().addHistoryNode(COL, node);
    useChainStore.getState().upsertEdge(COL, edge("e1", "h1", "b"));
    useChainStore.getState().removeHistoryNode(COL, "h1");
    expect(useChainStore.getState().configs[COL].historyNodes).toHaveLength(0);
    expect(useChainStore.getState().configs[COL].edges).toHaveLength(0);
  });

  it("upsertNodeAssertions and deleteNodeAssertions", () => {
    const assertions: ChainAssertion[] = [
      {
        id: "a1",
        source: "status",
        operator: "eq",
        expectedValue: "200",
        enabled: true,
      },
    ];
    useChainStore.getState().upsertNodeAssertions(COL, "r1", assertions);
    expect(useChainStore.getState().configs[COL].nodeAssertions?.r1).toEqual(
      assertions,
    );
    useChainStore.getState().deleteNodeAssertions(COL, "r1");
    expect(
      useChainStore.getState().configs[COL].nodeAssertions?.r1,
    ).toBeUndefined();
  });

  it("upsertDelayNode insert and update", () => {
    const d: DelayNodeConfig = { id: "d1", type: "delay", delayMs: 100 };
    useChainStore.getState().upsertDelayNode(COL, d);
    useChainStore.getState().upsertDelayNode(COL, { ...d, delayMs: 200 });
    expect(useChainStore.getState().configs[COL].delayNodes![0].delayMs).toBe(
      200,
    );
  });

  it("removeDelayNode strips related edges", () => {
    const d: DelayNodeConfig = { id: "d1", type: "delay", delayMs: 100 };
    useChainStore.getState().upsertDelayNode(COL, d);
    useChainStore.getState().upsertEdge(COL, edge("e1", "d1", "b"));
    useChainStore.getState().removeDelayNode(COL, "d1");
    expect(useChainStore.getState().configs[COL].delayNodes!.length).toBe(0);
    expect(useChainStore.getState().configs[COL].edges.length).toBe(0);
  });

  it("upsertConditionNode insert and update", () => {
    const c: ConditionNodeConfig = {
      id: "c1",
      type: "condition",
      variable: "{{v}}",
      branches: [],
    };
    useChainStore.getState().upsertConditionNode(COL, c);
    useChainStore.getState().upsertConditionNode(COL, {
      ...c,
      variable: "{{w}}",
    });
    expect(
      useChainStore.getState().configs[COL].conditionNodes![0].variable,
    ).toBe("{{w}}");
  });

  it("removeConditionNode strips related edges", () => {
    const c: ConditionNodeConfig = {
      id: "c1",
      type: "condition",
      variable: "{{v}}",
      branches: [],
    };
    useChainStore.getState().upsertConditionNode(COL, c);
    useChainStore.getState().upsertEdge(COL, edge("e1", "c1", "b"));
    useChainStore.getState().removeConditionNode(COL, "c1");
    expect(useChainStore.getState().configs[COL].conditionNodes!.length).toBe(
      0,
    );
    expect(useChainStore.getState().configs[COL].edges.length).toBe(0);
  });

  it("upsertDisplayNode insert and update", () => {
    const d: DisplayNodeConfig = {
      id: "d1",
      type: "display",
      sourceJsonPath: "$.x",
      targetField: "url",
      targetKey: "u",
    };
    useChainStore.getState().upsertDisplayNode(COL, d);
    useChainStore.getState().upsertDisplayNode(COL, {
      ...d,
      sourceJsonPath: "$.y",
    });
    expect(
      useChainStore.getState().configs[COL].displayNodes![0].sourceJsonPath,
    ).toBe("$.y");
  });

  it("removeDisplayNode strips related edges", () => {
    const d: DisplayNodeConfig = {
      id: "d1",
      type: "display",
      sourceJsonPath: "$.x",
      targetField: "url",
      targetKey: "u",
    };
    useChainStore.getState().upsertDisplayNode(COL, d);
    useChainStore.getState().upsertEdge(COL, edge("e1", "d1", "b"));
    useChainStore.getState().removeDisplayNode(COL, "d1");
    expect(useChainStore.getState().configs[COL].displayNodes!.length).toBe(0);
    expect(useChainStore.getState().configs[COL].edges.length).toBe(0);
  });

  it("upsertEnvPromotion and deleteEnvPromotion", () => {
    const p: EnvPromotion = {
      edgeId: "e1",
      envId: "env1",
      envVarName: "TOKEN",
    };
    useChainStore.getState().upsertEnvPromotion(COL, p);
    useChainStore.getState().upsertEnvPromotion(COL, {
      ...p,
      envVarName: "T2",
    });
    expect(
      useChainStore.getState().configs[COL].envPromotions![0].envVarName,
    ).toBe("T2");
    useChainStore.getState().deleteEnvPromotion(COL, "e1");
    expect(useChainStore.getState().configs[COL].envPromotions!.length).toBe(0);
  });

  it("persistConfig error shows toast", async () => {
    const db = {
      put: vi.fn().mockRejectedValue(new Error("put")),
    };
    vi.mocked(getDB).mockReturnValue(Promise.resolve(db as never));

    useChainStore.getState().upsertEdge(COL, edge("e1", "a", "b"));

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to save chain config", {
        description: "put",
      }),
    );
  });
});
