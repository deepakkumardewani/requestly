import { describe, expect, it } from "vitest";
import {
  buildStructurePathCompletionOptions,
  shouldSuppressStructureCompletion,
} from "./structureCompletion";

describe("shouldSuppressStructureCompletion", () => {
  it("returns false when line has no line comment", () => {
    expect(shouldSuppressStructureCompletion("data[*].id")).toBe(false);
    expect(shouldSuppressStructureCompletion("")).toBe(false);
  });

  it("returns true after // on the same line", () => {
    expect(shouldSuppressStructureCompletion("// hint")).toBe(true);
    expect(shouldSuppressStructureCompletion("x // comment")).toBe(true);
  });
});

describe("buildStructurePathCompletionOptions", () => {
  it("filters by case-insensitive prefix and applies suffix only", () => {
    const paths = ["user", "user.email", "users"];
    expect(buildStructurePathCompletionOptions(paths, "us")).toEqual([
      { label: "user", apply: "er", detail: "from JSON" },
      { label: "user.email", apply: "er.email", detail: "from JSON" },
      { label: "users", apply: "ers", detail: "from JSON" },
    ]);
  });

  it("returns empty when nothing matches", () => {
    expect(buildStructurePathCompletionOptions(["a.b"], "z")).toEqual([]);
  });

  it("returns all paths with full apply when prefix is empty", () => {
    expect(buildStructurePathCompletionOptions(["[*]", "[*].id"], "")).toEqual([
      { label: "[*]", apply: "[*]", detail: "from JSON" },
      { label: "[*].id", apply: "[*].id", detail: "from JSON" },
    ]);
  });

  it("handles bracket segments in apply", () => {
    expect(
      buildStructurePathCompletionOptions(["items[*].sku"], "items"),
    ).toEqual([
      { label: "items[*].sku", apply: "[*].sku", detail: "from JSON" },
    ]);
  });
});
