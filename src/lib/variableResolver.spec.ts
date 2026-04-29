import { describe, expect, it } from "vitest";
import { resolveVariables, tokenizeVariables } from "./variableResolver";

describe("resolveVariables", () => {
  it("replaces simple tokens from env", () => {
    expect(resolveVariables("Hello {{name}}", { name: "World" })).toBe(
      "Hello World",
    );
  });

  it("leaves missing keys as original token", () => {
    expect(resolveVariables("{{a}} {{missing}}", { a: "1" })).toBe(
      "1 {{missing}}",
    );
  });

  it("handles multiple occurrences and empty template", () => {
    expect(resolveVariables("", {})).toBe("");
    expect(resolveVariables("{{x}}{{x}}", { x: "0" })).toBe("00");
  });

  it("does not interpolate hyphenated variable names (regex is \\w+ only)", () => {
    expect(resolveVariables("{{a-b}}", { "a-b": "x" })).toBe("{{a-b}}");
    expect(resolveVariables("{{k}}", { k: "ok" })).toBe("ok");
  });
});

describe("tokenizeVariables", () => {
  it("returns a single literal when no variables", () => {
    expect(tokenizeVariables("plain", {})).toEqual([
      { text: "plain", isVariable: false, resolved: false },
    ]);
  });

  it("marks resolved when key exists in env", () => {
    expect(tokenizeVariables("{{a}}", { a: "1" })).toEqual([
      { text: "{{a}}", isVariable: true, resolved: true },
    ]);
  });

  it("marks unresolved when key missing", () => {
    expect(tokenizeVariables("{{a}}", {})).toEqual([
      { text: "{{a}}", isVariable: true, resolved: false },
    ]);
  });

  it("intersperse literal segments between variables", () => {
    expect(tokenizeVariables("pre{{x}}mid{{y}}", { x: "", y: "z" })).toEqual([
      { text: "pre", isVariable: false, resolved: false },
      { text: "{{x}}", isVariable: true, resolved: true },
      { text: "mid", isVariable: false, resolved: false },
      { text: "{{y}}", isVariable: true, resolved: true },
    ]);
  });
});
