import { beforeEach, describe, expect, it } from "vitest";
import { usePlaygroundStore } from "./usePlaygroundStore";

describe("usePlaygroundStore", () => {
  beforeEach(() => {
    usePlaygroundStore.setState({ playgrounds: {} });
  });

  it("getPlayground returns default state for unknown tab", () => {
    const pg = usePlaygroundStore.getState().getPlayground("unknown");
    expect(pg).toEqual({
      mode: "jsonpath",
      code: "",
      output: null,
      error: null,
    });
  });

  it("setCode updates code for tab without mutating other tabs", () => {
    usePlaygroundStore.getState().setCode("a", "console.log(1)");
    usePlaygroundStore.getState().setCode("b", "console.log(2)");
    expect(usePlaygroundStore.getState().getPlayground("a").code).toBe(
      "console.log(1)",
    );
    expect(usePlaygroundStore.getState().getPlayground("b").code).toBe(
      "console.log(2)",
    );
  });

  it("setMode switches mode and resets code, output, and error", () => {
    usePlaygroundStore.getState().setCode("t", "old");
    usePlaygroundStore.getState().setResult("t", "out", null);
    usePlaygroundStore.getState().setMode("t", "js");
    const pg = usePlaygroundStore.getState().getPlayground("t");
    expect(pg.mode).toBe("js");
    expect(pg.code).toBe("");
    expect(pg.output).toBeNull();
    expect(pg.error).toBeNull();
  });

  it("setResult sets output and error", () => {
    usePlaygroundStore.getState().setResult("t", "42", null);
    expect(usePlaygroundStore.getState().getPlayground("t").output).toBe("42");
    usePlaygroundStore.getState().setResult("t", null, "oops");
    const pg = usePlaygroundStore.getState().getPlayground("t");
    expect(pg.output).toBeNull();
    expect(pg.error).toBe("oops");
  });

  it("reset restores default playground for tab", () => {
    usePlaygroundStore.getState().setMode("t", "js");
    usePlaygroundStore.getState().setCode("t", "x");
    usePlaygroundStore.getState().setResult("t", "y", "z");
    usePlaygroundStore.getState().reset("t");
    expect(usePlaygroundStore.getState().getPlayground("t")).toEqual({
      mode: "jsonpath",
      code: "",
      output: null,
      error: null,
    });
  });
});
