/** @vitest-environment happy-dom */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as utils from "@/lib/utils";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useResponseStore } from "@/stores/useResponseStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type {
  GraphQLTab,
  HttpTab,
  RequestError,
  ResponseData,
  SocketIOTab,
  WebSocketTab,
} from "@/types";
import { useSendRequest } from "./useSendRequest";

const mocks = vi.hoisted(() => ({
  runRequest: vi.fn(),
  runGraphQLRequest: vi.fn(),
  runPreScript: vi.fn(),
  runPostScript: vi.fn(),
}));

vi.mock("@/lib/requestRunner", () => ({
  runRequest: mocks.runRequest,
  runGraphQLRequest: mocks.runGraphQLRequest,
}));

vi.mock("@/lib/scriptRunner", () => ({
  runPreScript: mocks.runPreScript,
  runPostScript: mocks.runPostScript,
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

import { toast } from "sonner";

function sampleResponse(overrides: Partial<ResponseData> = {}): ResponseData {
  return {
    status: 200,
    statusText: "OK",
    headers: {},
    body: "{}",
    duration: 42,
    size: 10,
    url: "https://example.com/final",
    method: "GET",
    timestamp: 1000,
    ...overrides,
  };
}

function httpTab(tabId: string, overrides: Partial<HttpTab> = {}): HttpTab {
  return {
    tabId,
    requestId: null,
    name: "Req",
    isDirty: false,
    type: "http",
    url: "https://example.com/path",
    method: "GET",
    headers: [],
    params: [],
    auth: { type: "none" },
    body: { type: "json", content: "{}" },
    preScript: "",
    postScript: "",
    ...overrides,
  };
}

function gqlTab(
  tabId: string,
  overrides: Partial<GraphQLTab> = {},
): GraphQLTab {
  return {
    tabId,
    requestId: null,
    name: "GQL",
    isDirty: false,
    type: "graphql",
    url: "https://example.com/graphql",
    headers: [],
    query: "{ ping }",
    variables: "{}",
    operationName: "",
    auth: { type: "none" },
    ...overrides,
  };
}

function wsTab(tabId: string): WebSocketTab {
  return {
    tabId,
    requestId: null,
    name: "WS",
    isDirty: false,
    type: "websocket",
    url: "wss://example.com",
    headers: [],
    messageLog: [],
  };
}

function socketIoTab(tabId: string): SocketIOTab {
  return {
    tabId,
    requestId: null,
    name: "IO",
    isDirty: false,
    type: "socketio",
    url: "http://example.com",
    headers: [],
    messageLog: [],
  };
}

function resetAllStores() {
  useTabsStore.setState({ tabs: [], activeTabId: null });
  useEnvironmentsStore.setState({ environments: [], activeEnvId: null });
  useResponseStore.setState({
    responses: {},
    loading: {},
    errors: {},
    scriptLogs: {},
  });
  useHistoryStore.setState({ entries: [] });
  useSettingsStore.setState({
    theme: "dark",
    proxyUrl: "",
    sslVerify: true,
    followRedirects: true,
    showHealthMonitor: true,
    showCodeGen: true,
    codeGenLang: "cURL",
    autoExpandExplainer: true,
    hydrated: false,
  });
}

describe("useSendRequest", () => {
  beforeEach(() => {
    resetAllStores();
    vi.clearAllMocks();
    mocks.runRequest.mockResolvedValue(sampleResponse());
    mocks.runGraphQLRequest.mockResolvedValue(
      sampleResponse({ method: "POST" }),
    );
    mocks.runPreScript.mockReturnValue({ logs: [] });
    mocks.runPostScript.mockReturnValue({ logs: [] });
    vi.spyOn(utils, "generateId").mockReturnValue("hist-entry-id");
  });

  it("returns early without toast when tab id is missing", async () => {
    const { result } = renderHook(() => useSendRequest("ghost"));
    await act(async () => {
      await result.current.send();
    });
    expect(toast.info).not.toHaveBeenCalled();
    expect(mocks.runRequest).not.toHaveBeenCalled();
  });

  it("shows info toast when tab type cannot send", async () => {
    useTabsStore.setState({
      tabs: [wsTab("ws1")],
      activeTabId: "ws1",
    });
    const { result } = renderHook(() => useSendRequest("ws1"));
    await act(async () => {
      await result.current.send();
    });
    expect(toast.info).toHaveBeenCalledWith(
      "Send is not available for this tab type",
    );
    expect(mocks.runRequest).not.toHaveBeenCalled();
  });

  it("shows info for socket.io tab type", async () => {
    useTabsStore.setState({
      tabs: [socketIoTab("io1")],
      activeTabId: "io1",
    });
    const { result } = renderHook(() => useSendRequest("io1"));
    await act(async () => {
      await result.current.send();
    });
    expect(toast.info).toHaveBeenCalledWith(
      "Send is not available for this tab type",
    );
  });

  it("warns when HTTP URL is blank", async () => {
    useTabsStore.setState({
      tabs: [httpTab("t1", { url: "   " })],
      activeTabId: "t1",
    });
    const { result } = renderHook(() => useSendRequest("t1"));
    await act(async () => {
      await result.current.send();
    });
    expect(toast.warning).toHaveBeenCalledWith(
      "Enter a URL to send the request",
    );
    expect(mocks.runRequest).not.toHaveBeenCalled();
  });

  it("warns when GraphQL query resolves empty", async () => {
    useTabsStore.setState({
      tabs: [gqlTab("g1", { query: "   " })],
      activeTabId: "g1",
    });
    const { result } = renderHook(() => useSendRequest("g1"));
    await act(async () => {
      await result.current.send();
    });
    expect(toast.warning).toHaveBeenCalledWith("Enter a GraphQL query");
    expect(useResponseStore.getState().loading["g1"]).toBe(false);
    expect(mocks.runGraphQLRequest).not.toHaveBeenCalled();
  });

  it("runs GraphQL request and stores response without history entry", async () => {
    const gqlResponse = sampleResponse({ status: 201, body: "[]" });
    mocks.runGraphQLRequest.mockResolvedValueOnce(gqlResponse);
    useTabsStore.setState({
      tabs: [gqlTab("g2")],
      activeTabId: "g2",
    });
    const { result } = renderHook(() => useSendRequest("g2"));
    await act(async () => {
      await result.current.send();
    });
    expect(mocks.runGraphQLRequest).toHaveBeenCalledTimes(1);
    expect(useResponseStore.getState().responses["g2"]).toEqual(gqlResponse);
    expect(useHistoryStore.getState().entries).toHaveLength(0);
    expect(mocks.runPreScript).not.toHaveBeenCalled();
  });

  it("runs HTTP GET and logs history", async () => {
    const res = sampleResponse({ url: "https://example.com/path" });
    mocks.runRequest.mockResolvedValueOnce(res);
    useTabsStore.setState({
      tabs: [httpTab("h1")],
      activeTabId: "h1",
    });
    const { result } = renderHook(() => useSendRequest("h1"));
    await act(async () => {
      await result.current.send();
    });
    expect(mocks.runRequest).toHaveBeenCalledTimes(1);
    expect(useResponseStore.getState().responses["h1"]).toEqual(res);
    const entries = useHistoryStore.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe("hist-entry-id");
    expect(entries[0]?.method).toBe("GET");
    expect(entries[0]?.status).toBe(res.status);
  });

  it("runs pre-script overrides and merges logs", async () => {
    mocks.runPreScript.mockReturnValueOnce({
      logs: ["pre"],
      requestOverrides: {
        url: "https://override.example",
      },
    });
    mocks.runPostScript.mockReturnValueOnce({ logs: ["post"], error: "pe" });
    const res = sampleResponse();
    mocks.runRequest.mockResolvedValueOnce(res);
    useTabsStore.setState({
      tabs: [
        httpTab("p1", {
          preScript: "rq.request.url.set('x')",
          postScript: "// x",
        }),
      ],
      activeTabId: "p1",
    });
    const { result } = renderHook(() => useSendRequest("p1"));
    await act(async () => {
      await result.current.send();
    });
    expect(mocks.runRequest.mock.calls[0]?.[0]?.url).toContain(
      "override.example",
    );
    expect(toast.error).toHaveBeenCalledWith("Post-response script error", {
      description: "pe",
    });
    expect(useResponseStore.getState().scriptLogs["p1"]).toEqual([
      "pre",
      "post",
    ]);
  });

  it("surfaces pre-script errors via toast but continues request", async () => {
    mocks.runPreScript.mockReturnValueOnce({
      logs: [],
      error: "pre-fail",
      requestOverrides: {},
    });
    const res = sampleResponse();
    mocks.runRequest.mockResolvedValueOnce(res);
    useTabsStore.setState({
      tabs: [httpTab("e1", { preScript: "// bad" })],
      activeTabId: "e1",
    });
    const { result } = renderHook(() => useSendRequest("e1"));
    await act(async () => {
      await result.current.send();
    });
    expect(toast.error).toHaveBeenCalledWith("Pre-request script error", {
      description: "pre-fail",
    });
    expect(mocks.runRequest).toHaveBeenCalled();
  });

  it("handles request failure", async () => {
    const err: RequestError = {
      type: "network",
      message: "offline",
      cause: "dns",
    };
    mocks.runRequest.mockRejectedValueOnce(err);
    useTabsStore.setState({
      tabs: [httpTab("err")],
      activeTabId: "err",
    });
    const { result } = renderHook(() => useSendRequest("err"));
    await act(async () => {
      await result.current.send();
    });
    expect(useResponseStore.getState().errors["err"]).toEqual(err);
    expect(toast.error).toHaveBeenCalledWith("Request failed: offline", {
      description: "dns",
    });
  });

  it("cancel clears loading flag", () => {
    useTabsStore.setState({
      tabs: [httpTab("c1")],
      activeTabId: "c1",
    });
    useResponseStore.getState().setLoading("c1", true);
    const { result } = renderHook(() => useSendRequest("c1"));
    act(() => {
      result.current.cancel();
    });
    expect(useResponseStore.getState().loading["c1"]).toBe(false);
  });

  it("exposes loading state from response store", () => {
    useTabsStore.setState({
      tabs: [httpTab("l1")],
      activeTabId: "l1",
    });
    useResponseStore.getState().setLoading("l1", true);
    const { result } = renderHook(() => useSendRequest("l1"));
    expect(result.current.isLoading).toBe(true);
  });
});
