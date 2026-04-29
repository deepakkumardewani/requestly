import { describe, expect, it } from "vitest";
import {
  diffJson,
  filterDiffToChangesOnly,
  formatJson,
  MAX_DIFF_DEPTH,
  parseJsonSafe,
} from "./jsonDiff";

describe("diffJson", () => {
  it("reports added and removed top-level keys", () => {
    const { nodes, stats } = diffJson({ a: 1 }, { b: 2 });
    expect(stats).toEqual({ added: 1, removed: 1, changed: 0 });
    expect(nodes.some((n) => n.kind === "added")).toBe(true);
    expect(nodes.some((n) => n.kind === "removed")).toBe(true);
  });

  it("reports changed primitives and unchanged leaves", () => {
    const { nodes, stats } = diffJson({ x: 1, y: 2 }, { x: 1, y: 3 });
    expect(stats.changed).toBe(1);
    expect(stats.added + stats.removed).toBe(0);
    const y = nodes.find((n) => n.key === "y" && n.children === null);
    expect(y?.kind).toBe("changed");
  });

  it("diffs nested objects and arrays", () => {
    const { stats } = diffJson(
      { u: { v: 1 }, arr: [1, 2] },
      { u: { v: 2 }, arr: [1, 2, 3] },
    );
    expect(stats.changed).toBeGreaterThanOrEqual(1);
    expect(stats.added).toBeGreaterThanOrEqual(1);
  });

  it("treats deeply nested structures as a single changed leaf past max depth", () => {
    let deepL: Record<string, unknown> = { v: 1 };
    let deepR: Record<string, unknown> = { v: 2 };
    for (let i = 0; i < MAX_DIFF_DEPTH + 2; i++) {
      deepL = { k: deepL };
      deepR = { k: deepR };
    }
    const { stats } = diffJson(deepL, deepR);
    expect(stats.changed).toBeGreaterThanOrEqual(1);
  });
});

describe("filterDiffToChangesOnly", () => {
  it("removes unchanged branches", () => {
    const { nodes } = diffJson({ a: 1, b: 2 }, { a: 1, b: 3 });
    const filtered = filterDiffToChangesOnly(nodes);
    expect(filtered.every((n) => n.kind !== "unchanged")).toBe(true);
  });
});

describe("parseJsonSafe", () => {
  it("returns null error for blank input", () => {
    expect(parseJsonSafe("   ")).toEqual({ value: null, error: null });
  });

  it("parses valid JSON", () => {
    expect(parseJsonSafe("[1]")).toEqual({ value: [1], error: null });
  });

  it("returns syntax message on invalid JSON", () => {
    const r = parseJsonSafe("{");
    expect(r.value).toBeNull();
    expect(r.error).toBeTruthy();
  });
});

describe("formatJson", () => {
  it("pretty-prints valid JSON and leaves invalid unchanged", () => {
    expect(formatJson('{"a":1}')).toContain("\n");
    expect(formatJson("not json")).toBe("not json");
  });
});
