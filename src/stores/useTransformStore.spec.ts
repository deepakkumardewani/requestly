import { beforeEach, describe, expect, it } from "vitest";
import { useTransformStore } from "./useTransformStore";

describe("useTransformStore", () => {
  beforeEach(() => {
    useTransformStore.getState().clear();
  });

  it("starts with jsonpath mode and empty fields", () => {
    const s = useTransformStore.getState();
    expect(s.mode).toBe("jsonpath");
    expect(s.inputBody).toBe("");
    expect(s.codeJsonPath).toBe("");
    expect(s.codeJs).toBe("");
    expect(s.output).toBeNull();
    expect(s.error).toBeNull();
  });

  it("setInputBody updates input", () => {
    useTransformStore.getState().setInputBody("{}");
    expect(useTransformStore.getState().inputBody).toBe("{}");
  });

  it("setCode updates codeJsonPath in jsonpath mode", () => {
    useTransformStore.getState().setCode("$.a");
    expect(useTransformStore.getState().codeJsonPath).toBe("$.a");
    expect(useTransformStore.getState().codeJs).toBe("");
  });

  it("setCode updates codeJs when mode is js", () => {
    useTransformStore.getState().setMode("js");
    useTransformStore.getState().setCode("return 1");
    expect(useTransformStore.getState().codeJs).toBe("return 1");
    expect(useTransformStore.getState().codeJsonPath).toBe("");
  });

  it("setMode switches mode", () => {
    useTransformStore.getState().setMode("js");
    expect(useTransformStore.getState().mode).toBe("js");
  });

  it("setResult sets output and error", () => {
    useTransformStore.getState().setResult("ok", null);
    expect(useTransformStore.getState().output).toBe("ok");
    expect(useTransformStore.getState().error).toBeNull();
    useTransformStore.getState().setResult(null, "bad");
    expect(useTransformStore.getState().output).toBeNull();
    expect(useTransformStore.getState().error).toBe("bad");
  });

  it("clear resets to initial", () => {
    useTransformStore.getState().setInputBody("x");
    useTransformStore.getState().setMode("js");
    useTransformStore.getState().setCode("c");
    useTransformStore.getState().setResult("o", "e");
    useTransformStore.getState().clear();
    const s = useTransformStore.getState();
    expect(s.inputBody).toBe("");
    expect(s.mode).toBe("jsonpath");
    expect(s.codeJs).toBe("");
    expect(s.output).toBeNull();
    expect(s.error).toBeNull();
  });
});
