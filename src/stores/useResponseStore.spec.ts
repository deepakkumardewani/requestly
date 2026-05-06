import { beforeEach, describe, expect, it } from "vitest";
import type { RequestError, ResponseData } from "@/types";
import { useResponseStore } from "./useResponseStore";

function sampleResponse(overrides: Partial<ResponseData> = {}): ResponseData {
  return {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    body: "{}",
    duration: 12,
    size: 100,
    url: "https://example.com",
    method: "GET",
    timestamp: 1,
    ...overrides,
  };
}

describe("useResponseStore", () => {
  beforeEach(() => {
    useResponseStore.setState({
      responses: {},
      loading: {},
      errors: {},
      scriptLogs: {},
    });
  });

  it("has empty initial maps", () => {
    const s = useResponseStore.getState();
    expect(s.responses).toEqual({});
    expect(s.loading).toEqual({});
    expect(s.errors).toEqual({});
    expect(s.scriptLogs).toEqual({});
  });

  it("setResponse stores response, clears loading and error for tab", () => {
    useResponseStore.getState().setLoading("t1", true);
    useResponseStore.getState().setError("t1", {
      type: "network",
      message: "fail",
    });
    const res = sampleResponse();
    useResponseStore.getState().setResponse("t1", res);
    expect(useResponseStore.getState().responses["t1"]).toEqual(res);
    expect(useResponseStore.getState().loading["t1"]).toBe(false);
    expect(useResponseStore.getState().errors["t1"]).toBeNull();
  });

  it("clearResponse nulls response and error, clears scriptLogs for tab", () => {
    useResponseStore.getState().setResponse("t1", sampleResponse());
    useResponseStore.getState().setScriptLogs("t1", ["log"]);
    useResponseStore.getState().clearResponse("t1");
    expect(useResponseStore.getState().responses["t1"]).toBeNull();
    expect(useResponseStore.getState().loading["t1"]).toBe(false);
    expect(useResponseStore.getState().errors["t1"]).toBeNull();
    expect(useResponseStore.getState().scriptLogs["t1"]).toEqual([]);
  });

  it("clearResponse for unknown tab creates cleared keys", () => {
    useResponseStore.getState().clearResponse("missing");
    expect(useResponseStore.getState().responses["missing"]).toBeNull();
    expect(useResponseStore.getState().scriptLogs["missing"]).toEqual([]);
  });

  it("setLoading sets loading and clears error and script logs", () => {
    useResponseStore.getState().setError("t1", {
      type: "timeout",
      message: "slow",
    });
    useResponseStore.getState().setScriptLogs("t1", ["a"]);
    useResponseStore.getState().setLoading("t1", true);
    expect(useResponseStore.getState().loading["t1"]).toBe(true);
    expect(useResponseStore.getState().errors["t1"]).toBeNull();
    expect(useResponseStore.getState().scriptLogs["t1"]).toEqual([]);
  });

  it("setError sets error and clears loading", () => {
    useResponseStore.getState().setLoading("t1", true);
    const err: RequestError = { type: "parse", message: "bad json" };
    useResponseStore.getState().setError("t1", err);
    expect(useResponseStore.getState().errors["t1"]).toEqual(err);
    expect(useResponseStore.getState().loading["t1"]).toBe(false);
  });

  it("setScriptLogs merges scriptLogs for tab only", () => {
    useResponseStore.getState().setScriptLogs("t1", ["x"]);
    useResponseStore.getState().setScriptLogs("t2", ["y"]);
    expect(useResponseStore.getState().scriptLogs["t1"]).toEqual(["x"]);
    expect(useResponseStore.getState().scriptLogs["t2"]).toEqual(["y"]);
  });

  it("isolates tabs in responses", () => {
    useResponseStore.getState().setResponse("a", sampleResponse());
    useResponseStore
      .getState()
      .setResponse("b", sampleResponse({ status: 404 }));
    expect(useResponseStore.getState().responses["a"]?.status).toBe(200);
    expect(useResponseStore.getState().responses["b"]?.status).toBe(404);
  });
});
