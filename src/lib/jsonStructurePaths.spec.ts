import { describe, expect, it } from "vitest";
import {
  buildJsonPathSuggestions,
  buildJsonPathSuggestionsFromText,
  extractTopLevelKeysFromJsonLikeText,
} from "./jsonStructurePaths";

describe("buildJsonPathSuggestions", () => {
  it("returns [] for null, primitives, and undefined-like roots", () => {
    expect(buildJsonPathSuggestions(null)).toEqual([]);
    expect(buildJsonPathSuggestions(undefined)).toEqual([]);
    expect(buildJsonPathSuggestions(0)).toEqual([]);
    expect(buildJsonPathSuggestions("x")).toEqual([]);
    expect(buildJsonPathSuggestions(true)).toEqual([]);
  });

  it("emits nested object paths", () => {
    const value = { user: { email: "a@b.c", profile: { id: 1 } } };
    const paths = buildJsonPathSuggestions(value);
    expect(paths).toContain("user");
    expect(paths).toContain("user.email");
    expect(paths).toContain("user.profile");
    expect(paths).toContain("user.profile.id");
    const shallowFirst = paths.indexOf("user") < paths.indexOf("user.email");
    expect(shallowFirst).toBe(true);
  });

  it("emits array wildcard, numeric indices, and child paths", () => {
    const value = [{ id: 1, name: "x" }, { id: 2 }];
    const paths = buildJsonPathSuggestions(value, {
      maxArrayNumericSamples: 2,
    });
    expect(paths).toContain("[*]");
    expect(paths).toContain("[0]");
    expect(paths).toContain("[1]");
    expect(paths).toContain("[*].id");
    expect(paths).toContain("[*].name");
  });

  it("handles object containing arrays with dotted and bracket segments", () => {
    const value = { items: [{ sku: "a" }, { sku: "b" }] };
    const paths = buildJsonPathSuggestions(value);
    expect(paths).toContain("items");
    expect(paths).toContain("items[*]");
    expect(paths).toContain("items[0]");
    expect(paths).toContain("items[*].sku");
  });

  it("returns [] for empty object (no path segments)", () => {
    expect(buildJsonPathSuggestions({})).toEqual([]);
  });

  it("still suggests [*] for empty array", () => {
    expect(buildJsonPathSuggestions([])).toEqual(["[*]"]);
  });

  it("respects maxDepth", () => {
    const value = { a: { b: { c: { d: 1 } } } };
    const deep = buildJsonPathSuggestions(value, { maxDepth: 4 });
    expect(deep).toContain("a.b.c.d");
    const shallow = buildJsonPathSuggestions(value, { maxDepth: 1 });
    expect(shallow).toContain("a");
    expect(shallow).toContain("a.b");
    expect(shallow).not.toContain("a.b.c");
  });

  it("respects maxPaths", () => {
    const value: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      value[`k${i}`] = i;
    }
    const paths = buildJsonPathSuggestions(value, { maxPaths: 5 });
    expect(paths.length).toBeLessThanOrEqual(5);
  });

  it("does not throw on circular references and terminates", () => {
    type Node = { self?: Node; other?: number };
    const a: Node = { other: 1 };
    a.self = a;
    const paths = buildJsonPathSuggestions(a, { maxPaths: 50 });
    expect(paths).toContain("self");
    expect(paths).toContain("other");
    expect(paths.length).toBeLessThanOrEqual(50);
  });

  it("limits numeric array samples when array is short", () => {
    const value = [1, 2];
    const paths = buildJsonPathSuggestions(value, {
      maxArrayNumericSamples: 5,
    });
    expect(paths).toContain("[0]");
    expect(paths).toContain("[1]");
    expect(paths).not.toContain("[2]");
  });

  it("dedupes paths", () => {
    const value = { x: 1 };
    const paths = buildJsonPathSuggestions(value);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe("extractTopLevelKeysFromJsonLikeText", () => {
  it("extracts keys from invalid JSON using regex", () => {
    const text = '{ "email": x, "name": ';
    expect(extractTopLevelKeysFromJsonLikeText(text, 5)).toEqual([
      "email",
      "name",
    ]);
  });

  it("respects maxKeys and only scans the first snippet of text", () => {
    const text = `{ "a": 1, "b": 2, "c": 3 }${"x".repeat(6000)}`;
    expect(extractTopLevelKeysFromJsonLikeText(text, 2)).toEqual(["a", "b"]);
  });

  it("returns [] when no matches", () => {
    expect(extractTopLevelKeysFromJsonLikeText("not json", 3)).toEqual([]);
  });
});

describe("buildJsonPathSuggestionsFromText", () => {
  it("parses valid JSON and returns structure paths", () => {
    const text = '{"a": {"b": 1}}';
    expect(buildJsonPathSuggestionsFromText(text)).toEqual(["a", "a.b"]);
  });

  it("falls back to regex keys when parse fails", () => {
    const text = '{ "foo": ';
    expect(buildJsonPathSuggestionsFromText(text)).toEqual(["foo"]);
  });

  it("passes maxKeysFromFallback on invalid JSON", () => {
    const text = '{"a":1,"b":2,"c":3}broken';
    const paths = buildJsonPathSuggestionsFromText(text, {
      maxKeysFromFallback: 2,
    });
    expect(paths.length).toBeLessThanOrEqual(2);
  });
});
