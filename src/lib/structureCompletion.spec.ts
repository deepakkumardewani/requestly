import { describe, expect, it } from "vitest";
import {
  buildStructurePathCompletionOptions,
  getStructureCompletionRange,
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

describe("getStructureCompletionRange", () => {
  it("jsonpath: captures the path token at end of line", () => {
    expect(getStructureCompletionRange("jsonpath", "user.pro")).toEqual({
      fromOffset: 0,
      typedPrefix: "user.pro",
    });
    expect(getStructureCompletionRange("jsonpath", "  data[*].id ")).toBeNull();
  });

  it("jsonpath: null when there is no path token at end", () => {
    expect(getStructureCompletionRange("jsonpath", "")).toBeNull();
  });

  it("js: uses suffix after the last response.json. for path filtering", () => {
    expect(
      getStructureCompletionRange("js", "return response.json.user"),
    ).toEqual({ fromOffset: 21, typedPrefix: "user" });
    expect(getStructureCompletionRange("js", "return response.json.")).toEqual({
      fromOffset: 21,
      typedPrefix: "",
    });
  });

  it("js: uses suffix after response. when not entering response.json.*", () => {
    expect(getStructureCompletionRange("js", "return response.t")).toEqual({
      fromOffset: 16,
      typedPrefix: "t",
    });
    expect(getStructureCompletionRange("js", "return response.j")).toEqual({
      fromOffset: 16,
      typedPrefix: "j",
    });
  });

  it("js: does not use response. branch when response.json. is present", () => {
    expect(getStructureCompletionRange("js", "x response.json.b")).toEqual({
      fromOffset: 16,
      typedPrefix: "b",
    });
  });

  it("js: fragment mode uses the trailing path token", () => {
    expect(getStructureCompletionRange("js", "  foo.bar")).toEqual({
      fromOffset: 2,
      typedPrefix: "foo.bar",
    });
  });
});
