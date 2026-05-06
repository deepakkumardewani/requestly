import { beforeEach, describe, expect, it } from "vitest";
import type { DiffResult } from "@/lib/jsonDiff";
import { useJsonCompareStore } from "./useJsonCompareStore";

const sampleDiff: DiffResult = {
  nodes: [],
  stats: { added: 0, removed: 0, changed: 0 },
};

describe("useJsonCompareStore", () => {
  beforeEach(() => {
    useJsonCompareStore.getState().clear();
  });

  it("starts with empty inputs and null errors and diff", () => {
    const s = useJsonCompareStore.getState();
    expect(s.leftInput).toBe("");
    expect(s.rightInput).toBe("");
    expect(s.leftError).toBeNull();
    expect(s.rightError).toBeNull();
    expect(s.diffResult).toBeNull();
  });

  it("setLeftInput and setRightInput update strings", () => {
    useJsonCompareStore.getState().setLeftInput('{"a":1}');
    useJsonCompareStore.getState().setRightInput('{"a":2}');
    expect(useJsonCompareStore.getState().leftInput).toBe('{"a":1}');
    expect(useJsonCompareStore.getState().rightInput).toBe('{"a":2}');
  });

  it("setLeftError and setRightError set error strings", () => {
    useJsonCompareStore.getState().setLeftError("bad left");
    useJsonCompareStore.getState().setRightError(null);
    expect(useJsonCompareStore.getState().leftError).toBe("bad left");
    expect(useJsonCompareStore.getState().rightError).toBeNull();
  });

  it("setDiffResult stores diff payload", () => {
    useJsonCompareStore.getState().setDiffResult(sampleDiff);
    expect(useJsonCompareStore.getState().diffResult).toEqual(sampleDiff);
    useJsonCompareStore.getState().setDiffResult(null);
    expect(useJsonCompareStore.getState().diffResult).toBeNull();
  });

  it("swap exchanges left and right and clears errors and diff", () => {
    useJsonCompareStore.getState().setLeftInput("L");
    useJsonCompareStore.getState().setRightInput("R");
    useJsonCompareStore.getState().setLeftError("e1");
    useJsonCompareStore.getState().setRightError("e2");
    useJsonCompareStore.getState().setDiffResult(sampleDiff);
    useJsonCompareStore.getState().swap();
    const s = useJsonCompareStore.getState();
    expect(s.leftInput).toBe("R");
    expect(s.rightInput).toBe("L");
    expect(s.leftError).toBeNull();
    expect(s.rightError).toBeNull();
    expect(s.diffResult).toBeNull();
  });

  it("clear resets to initial state", () => {
    useJsonCompareStore.getState().setLeftInput("x");
    useJsonCompareStore.getState().setRightInput("y");
    useJsonCompareStore.getState().setLeftError("err");
    useJsonCompareStore.getState().setDiffResult(sampleDiff);
    useJsonCompareStore.getState().clear();
    const s = useJsonCompareStore.getState();
    expect(s.leftInput).toBe("");
    expect(s.rightInput).toBe("");
    expect(s.leftError).toBeNull();
    expect(s.rightError).toBeNull();
    expect(s.diffResult).toBeNull();
  });
});
