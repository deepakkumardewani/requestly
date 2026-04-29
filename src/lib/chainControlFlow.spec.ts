import { describe, expect, it } from "vitest";
import type { ChainEdge } from "@/types/chain";
import {
  buildVarValues,
  evaluateCondition,
  resolveDelay,
} from "./chainControlFlow";

describe("resolveDelay", () => {
  it("resolves after delay when not aborted", async () => {
    await expect(
      resolveDelay(
        { id: "d", type: "delay", delayMs: 5 },
        new AbortController().signal,
      ),
    ).resolves.toBeUndefined();
  });

  it("rejects immediately when signal already aborted", async () => {
    const ac = new AbortController();
    ac.abort();
    await expect(
      resolveDelay({ id: "d", type: "delay", delayMs: 100 }, ac.signal),
    ).rejects.toThrow("Aborted");
  });

  it("rejects when aborted during wait", async () => {
    const ac = new AbortController();
    const p = resolveDelay(
      { id: "d", type: "delay", delayMs: 10_000 },
      ac.signal,
    );
    queueMicrotask(() => ac.abort());
    await expect(p).rejects.toThrow("Aborted");
  });
});

describe("evaluateCondition", () => {
  const node = {
    id: "c",
    type: "condition" as const,
    variable: "{{role}}",
    branches: [
      { id: "b-admin", label: "admin", expression: `== 'admin'` },
      { id: "b-else", label: "else", expression: "" },
    ],
  };

  it("returns null when no branches", () => {
    expect(
      evaluateCondition({ ...node, branches: [] }, { role: "admin" }),
    ).toBeNull();
  });

  it("matches first string equality branch", () => {
    expect(evaluateCondition(node, { role: "admin" })).toBe("b-admin");
  });

  it("falls through to else branch when no match", () => {
    expect(evaluateCondition(node, { role: "guest" })).toBe("b-else");
  });

  it("matches numeric equality, inequality, ordering, and contains", () => {
    expect(
      evaluateCondition(
        { ...node, branches: [{ id: "e", label: "e", expression: `== 'a'` }] },
        { role: "a" },
      ),
    ).toBe("e");
    expect(
      evaluateCondition(
        { ...node, branches: [{ id: "n", label: "n", expression: "!= 99" }] },
        { role: "10" },
      ),
    ).toBe("n");
    expect(
      evaluateCondition(
        { ...node, branches: [{ id: "g", label: "g", expression: "> 5" }] },
        { role: "10" },
      ),
    ).toBe("g");
    expect(
      evaluateCondition(
        { ...node, branches: [{ id: "l", label: "l", expression: "< 20" }] },
        { role: "10" },
      ),
    ).toBe("l");
    expect(
      evaluateCondition(
        {
          ...node,
          branches: [{ id: "co", label: "co", expression: `contains 'lo'` }],
        },
        { role: "hello" },
      ),
    ).toBe("co");
  });

  it("uses empty string when variable missing from map", () => {
    expect(
      evaluateCondition(
        {
          ...node,
          branches: [{ id: "m", label: "m", expression: `== ''` }],
        },
        {},
      ),
    ).toBe("m");
  });

  it("variable may include braces in config", () => {
    expect(
      evaluateCondition(
        { ...node, variable: "role", branches: node.branches },
        { role: "admin" },
      ),
    ).toBe("b-admin");
  });
});

describe("buildVarValues", () => {
  const edgeBase = {
    id: "e1",
    sourceRequestId: "a",
    targetRequestId: "b",
    injections: [
      {
        sourceJsonPath: "$.data.userId",
        targetField: "header" as const,
        targetKey: "x",
      },
    ],
  } satisfies Omit<ChainEdge, "branchId">;

  it("skips edges with branchId", () => {
    expect(
      buildVarValues([{ ...edgeBase, branchId: "left" } as ChainEdge], {
        e1: "v",
      }),
    ).toEqual({});
  });

  it("maps injection path last segment to extracted value", () => {
    expect(
      buildVarValues([edgeBase as ChainEdge], { "e1:$.data.userId": "u42" }),
    ).toEqual({ userId: "u42" });
  });

  it("falls back to edge id key in extractedValues", () => {
    expect(buildVarValues([edgeBase as ChainEdge], { e1: "raw" })).toEqual({
      userId: "raw",
    });
  });

  it("skips null and undefined extracted values", () => {
    expect(
      buildVarValues([edgeBase as ChainEdge], {
        "e1:$.data.userId": null,
      }),
    ).toEqual({});
  });
});
