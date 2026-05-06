import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestModel } from "@/types";
import type {
  ChainAssertion,
  ChainEdge,
  ConditionNodeConfig,
  DisplayNodeConfig,
} from "@/types/chain";

vi.mock("@/lib/requestRunner", () => ({
  runRequest: vi.fn(),
}));

import { runRequest } from "@/lib/requestRunner";
import {
  buildExecutionOrder,
  CircularDependencyError,
  runChain,
} from "./chainRunner";

function rq(id: string, overrides?: Partial<RequestModel>): RequestModel {
  return {
    id,
    collectionId: "c",
    name: id,
    method: "GET",
    url: `https://api.test/${id}`,
    params: [],
    headers: [],
    auth: { type: "none" },
    body: { type: "json", content: "{}" },
    preScript: "",
    postScript: "",
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("buildExecutionOrder", () => {
  it("orders nodes in dependency order", () => {
    const a = rq("a");
    const b = rq("b");
    const edges: ChainEdge[] = [
      {
        id: "e1",
        sourceRequestId: "a",
        targetRequestId: "b",
        injections: [],
      },
    ];
    expect(buildExecutionOrder([a, b], edges)).toEqual(["a", "b"]);
  });

  it("throws CircularDependencyError when a cycle exists", () => {
    const a = rq("a");
    const b = rq("b");
    const edges: ChainEdge[] = [
      {
        id: "e1",
        sourceRequestId: "a",
        targetRequestId: "b",
        injections: [],
      },
      {
        id: "e2",
        sourceRequestId: "b",
        targetRequestId: "a",
        injections: [],
      },
    ];
    expect(() => buildExecutionOrder([a, b], edges)).toThrow(
      CircularDependencyError,
    );
  });
});

describe("runChain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs API nodes sequentially and marks them passed", async () => {
    vi.mocked(runRequest).mockResolvedValue({
      status: 200,
      statusText: "OK",
      headers: {},
      body: "{}",
      duration: 1,
      size: 2,
      url: "",
      method: "GET",
      timestamp: 0,
    });

    const a = rq("a");
    const b = rq("b");
    const edges: ChainEdge[] = [
      {
        id: "e1",
        sourceRequestId: "a",
        targetRequestId: "b",
        injections: [],
      },
    ];

    const updates: Array<{ id: string; state: string }> = [];
    await runChain(
      [a, b],
      edges,
      (id, state) => {
        if (state === "running" || state === "passed" || state === "failed") {
          updates.push({ id, state });
        }
      },
      new AbortController().signal,
    );

    expect(vi.mocked(runRequest)).toHaveBeenCalledTimes(2);
    expect(
      updates.filter((u) => u.state === "passed").map((u) => u.id),
    ).toEqual(["a", "b"]);
  });

  it("skips downstream when upstream HTTP request fails", async () => {
    vi.mocked(runRequest).mockResolvedValueOnce({
      status: 500,
      statusText: "Err",
      headers: {},
      body: "",
      duration: 1,
      size: 0,
      url: "",
      method: "GET",
      timestamp: 0,
    });

    const a = rq("a");
    const b = rq("b");
    const edges: ChainEdge[] = [
      {
        id: "e1",
        sourceRequestId: "a",
        targetRequestId: "b",
        injections: [],
      },
    ];

    const states: Record<string, string> = {};
    await runChain(
      [a, b],
      edges,
      (id, state) => {
        if (state !== "running") states[id] = state;
      },
      new AbortController().signal,
    );

    expect(states.a).toBe("failed");
    expect(states.b).toBe("skipped");
    expect(vi.mocked(runRequest)).toHaveBeenCalledTimes(1);
  });

  it("marks node failed when runRequest throws", async () => {
    vi.mocked(runRequest).mockRejectedValueOnce(new Error("network down"));

    const a = rq("a");
    let finalState = "";
    let finalError: string | undefined;
    await runChain(
      [a],
      [],
      (id, state, data) => {
        if (id === "a" && state === "failed") {
          finalState = state;
          finalError = data.error;
        }
      },
      new AbortController().signal,
    );

    expect(finalState).toBe("failed");
    expect(finalError).toBe("network down");
  });

  it("fails node when assertions do not pass", async () => {
    vi.mocked(runRequest).mockResolvedValue({
      status: 200,
      statusText: "OK",
      headers: {},
      body: "{}",
      duration: 1,
      size: 2,
      url: "",
      method: "GET",
      timestamp: 0,
    });

    const a = rq("a");
    const assertions: ChainAssertion[] = [
      {
        id: "as1",
        source: "status",
        operator: "eq",
        expectedValue: "404",
        enabled: true,
      },
    ];

    let finalState = "";
    await runChain(
      [a],
      [],
      (id, state) => {
        if (id === "a" && (state === "passed" || state === "failed")) {
          finalState = state;
        }
      },
      new AbortController().signal,
      { a: assertions },
    );

    expect(finalState).toBe("failed");
  });

  it("marks every node skipped when graph has a circular dependency", async () => {
    const a = rq("a");
    const b = rq("b");
    const edges: ChainEdge[] = [
      {
        id: "e1",
        sourceRequestId: "a",
        targetRequestId: "b",
        injections: [],
      },
      {
        id: "e2",
        sourceRequestId: "b",
        targetRequestId: "a",
        injections: [],
      },
    ];

    const skipped: string[] = [];
    await runChain(
      [a, b],
      edges,
      (id, state, data) => {
        if (state === "skipped" && data.error?.includes("Circular")) {
          skipped.push(id);
        }
      },
      new AbortController().signal,
    );

    expect(skipped.sort()).toEqual(["a", "b"]);
    expect(vi.mocked(runRequest)).not.toHaveBeenCalled();
  });

  it("skips remaining nodes when run is aborted during a delay node", async () => {
    vi.mocked(runRequest).mockResolvedValue({
      status: 200,
      statusText: "OK",
      headers: {},
      body: "{}",
      duration: 1,
      size: 2,
      url: "",
      method: "GET",
      timestamp: 0,
    });

    const a = rq("a");
    const b = rq("b");
    const edges: ChainEdge[] = [
      {
        id: "e1",
        sourceRequestId: "a",
        targetRequestId: "d",
        injections: [],
      },
      {
        id: "e2",
        sourceRequestId: "d",
        targetRequestId: "b",
        injections: [],
      },
    ];

    const ac = new AbortController();
    let delaySawRunning = false;

    await runChain(
      [a, b],
      edges,
      (id, state) => {
        if (id === "d" && state === "running") {
          delaySawRunning = true;
          ac.abort();
        }
      },
      ac.signal,
      undefined,
      [{ id: "d", type: "delay", delayMs: 60_000 }],
    );

    expect(delaySawRunning).toBe(true);
    expect(vi.mocked(runRequest)).toHaveBeenCalledTimes(1);
  });

  it("skips success-branch downstream when upstream request fails", async () => {
    vi.mocked(runRequest).mockResolvedValue({
      status: 500,
      statusText: "Err",
      headers: {},
      body: "",
      duration: 1,
      size: 0,
      url: "",
      method: "GET",
      timestamp: 0,
    });

    const a = rq("a");
    const b = rq("b");
    const edges: ChainEdge[] = [
      {
        id: "e1",
        sourceRequestId: "a",
        targetRequestId: "b",
        branchId: "success",
        injections: [],
      },
    ];

    const states: Record<string, string> = {};
    await runChain(
      [a, b],
      edges,
      (id, state) => {
        if (state !== "running") states[id] = state;
      },
      new AbortController().signal,
    );

    expect(states.a).toBe("failed");
    expect(states.b).toBe("skipped");
    expect(vi.mocked(runRequest)).toHaveBeenCalledTimes(1);
  });

  it("runs fail-branch downstream when upstream request fails", async () => {
    vi.mocked(runRequest)
      .mockResolvedValueOnce({
        status: 500,
        statusText: "Err",
        headers: {},
        body: "",
        duration: 1,
        size: 0,
        url: "",
        method: "GET",
        timestamp: 0,
      })
      .mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
        duration: 1,
        size: 2,
        url: "",
        method: "GET",
        timestamp: 0,
      });

    const a = rq("a");
    const b = rq("b");
    const edges: ChainEdge[] = [
      {
        id: "e1",
        sourceRequestId: "a",
        targetRequestId: "b",
        branchId: "fail",
        injections: [],
      },
    ];

    const states: Record<string, string> = {};
    await runChain(
      [a, b],
      edges,
      (id, state) => {
        if (state !== "running") states[id] = state;
      },
      new AbortController().signal,
    );

    expect(states.a).toBe("failed");
    expect(states.b).toBe("passed");
    expect(vi.mocked(runRequest)).toHaveBeenCalledTimes(2);
  });

  it("evaluates condition node and follows matching branch", async () => {
    vi.mocked(runRequest)
      .mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        headers: {},
        body: JSON.stringify({ role: "admin" }),
        duration: 1,
        size: 10,
        url: "",
        method: "GET",
        timestamp: 0,
      })
      .mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
        duration: 1,
        size: 2,
        url: "",
        method: "GET",
        timestamp: 0,
      });

    const a = rq("a");
    const b = rq("b");
    const edges: ChainEdge[] = [
      {
        id: "e_ac",
        sourceRequestId: "a",
        targetRequestId: "c",
        injections: [
          {
            sourceJsonPath: "$.role",
            targetField: "header",
            targetKey: "role",
          },
        ],
      },
      {
        id: "e_cb",
        sourceRequestId: "c",
        targetRequestId: "b",
        branchId: "br1",
        injections: [],
      },
    ];

    const conditionNodes: ConditionNodeConfig[] = [
      {
        id: "c",
        type: "condition",
        variable: "{{role}}",
        branches: [
          { id: "br1", label: "admin", expression: "== 'admin'" },
          { id: "br_else", label: "else", expression: "" },
        ],
      },
    ];

    await runChain(
      [a, b],
      edges,
      vi.fn(),
      new AbortController().signal,
      undefined,
      undefined,
      conditionNodes,
    );

    expect(vi.mocked(runRequest)).toHaveBeenCalledTimes(2);
  });

  it("runs display node and forwards extracted value into downstream request", async () => {
    vi.mocked(runRequest)
      .mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        headers: {},
        body: JSON.stringify({ token: "secret" }),
        duration: 1,
        size: 20,
        url: "",
        method: "GET",
        timestamp: 0,
      })
      .mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
        duration: 1,
        size: 2,
        url: "",
        method: "GET",
        timestamp: 0,
      });

    const a = rq("a");
    const b = rq("b", { headers: [] });
    const edges: ChainEdge[] = [
      {
        id: "e_ad",
        sourceRequestId: "a",
        targetRequestId: "disp",
        injections: [],
      },
      {
        id: "e_db",
        sourceRequestId: "disp",
        targetRequestId: "b",
        injections: [],
      },
    ];

    const displayNodes: DisplayNodeConfig[] = [
      {
        id: "disp",
        type: "display",
        sourceJsonPath: "$.token",
        targetField: "header",
        targetKey: "X-Token",
      },
    ];

    await runChain(
      [a, b],
      edges,
      vi.fn(),
      new AbortController().signal,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      displayNodes,
    );

    const second = vi.mocked(runRequest).mock.calls[1]?.[0];
    expect(second?.headers.some((h) => h.key === "X-Token")).toBe(true);
    expect(second?.headers.find((h) => h.key === "X-Token")?.value).toBe(
      "secret",
    );
  });

  it("applies URL query injection from upstream JSON", async () => {
    vi.mocked(runRequest)
      .mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        headers: {},
        body: JSON.stringify({ q: "hello world" }),
        duration: 1,
        size: 30,
        url: "",
        method: "GET",
        timestamp: 0,
      })
      .mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
        duration: 1,
        size: 2,
        url: "",
        method: "GET",
        timestamp: 0,
      });

    const a = rq("a");
    const b = rq("b", { url: "https://api.test/search" });
    const edges: ChainEdge[] = [
      {
        id: "e1",
        sourceRequestId: "a",
        targetRequestId: "b",
        injections: [
          {
            sourceJsonPath: "$.q",
            targetField: "url",
            targetKey: "q",
          },
        ],
      },
    ];

    await runChain([a, b], edges, vi.fn(), new AbortController().signal);

    const second = vi.mocked(runRequest).mock.calls[1]?.[0];
    expect(second?.url).toContain("q=");
    expect(second?.url).toContain(encodeURIComponent("hello world"));
  });

  it("calls onPromoteToEnv when promotion matches an edge", async () => {
    vi.mocked(runRequest)
      .mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        headers: {},
        body: JSON.stringify({ id: "promo-val" }),
        duration: 1,
        size: 30,
        url: "",
        method: "GET",
        timestamp: 0,
      })
      .mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
        duration: 1,
        size: 2,
        url: "",
        method: "GET",
        timestamp: 0,
      });

    const a = rq("a");
    const b = rq("b");
    const edges: ChainEdge[] = [
      {
        id: "e1",
        sourceRequestId: "a",
        targetRequestId: "b",
        injections: [
          {
            sourceJsonPath: "$.id",
            targetField: "header",
            targetKey: "X-Id",
          },
        ],
      },
    ];

    const promote = vi.fn();
    await runChain(
      [a, b],
      edges,
      vi.fn(),
      new AbortController().signal,
      undefined,
      undefined,
      undefined,
      [
        {
          edgeId: "e1",
          envId: "env-1",
          envVarName: "PROMOTED",
        },
      ],
      promote,
    );

    expect(promote).toHaveBeenCalledWith("env-1", "PROMOTED", "promo-val");
  });

  it("skips node when JSONPath extraction fails for required injection", async () => {
    vi.mocked(runRequest).mockResolvedValueOnce({
      status: 200,
      statusText: "OK",
      headers: {},
      body: JSON.stringify({ x: 1 }),
      duration: 1,
      size: 10,
      url: "",
      method: "GET",
      timestamp: 0,
    });

    const a = rq("a");
    const b = rq("b");
    const edges: ChainEdge[] = [
      {
        id: "e1",
        sourceRequestId: "a",
        targetRequestId: "b",
        injections: [
          {
            sourceJsonPath: "$.missing",
            targetField: "header",
            targetKey: "h",
          },
        ],
      },
    ];

    let bState = "";
    await runChain(
      [a, b],
      edges,
      (id, state) => {
        if (id === "b" && state !== "running") bState = state;
      },
      new AbortController().signal,
    );

    expect(bState).toBe("skipped");
    expect(vi.mocked(runRequest)).toHaveBeenCalledTimes(1);
  });
});
