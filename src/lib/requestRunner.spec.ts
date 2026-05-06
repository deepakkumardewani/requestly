import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runGraphQLRequest, runRequest } from "./requestRunner";

function proxyJsonResponse(
  payload: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    error?: string;
    code?: string;
  },
  init?: { ok?: boolean },
) {
  const ok = init?.ok ?? !payload.error;
  return {
    ok,
    headers: new Headers({ "x-elapsed": "12" }),
    json: async () => payload,
  };
}

describe("runRequest", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      proxyJsonResponse({
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: '{"a":1}',
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("posts merged headers and JSON body to the proxy", async () => {
    await runRequest({
      method: "POST",
      url: "https://api.example.com/x",
      headers: [
        { id: "1", key: "X-App", value: "test", enabled: true },
        { id: "2", key: "Ignored", value: "x", enabled: false },
      ],
      body: { type: "json", content: '{"q":1}' },
      auth: { type: "bearer", token: "tok" },
      sslVerify: false,
      followRedirects: false,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    const sent = JSON.parse(init.body as string);
    expect(sent.url).toBe("https://api.example.com/x");
    expect(sent.method).toBe("POST");
    expect(sent.sslVerify).toBe(false);
    expect(sent.followRedirects).toBe(false);
    expect(sent.headers.Authorization).toBe("Bearer tok");
    expect(sent.headers["Content-Type"]).toBe("application/json");
    expect(sent.headers["X-App"]).toBe("test");
    expect(sent.body).toBe('{"q":1}');
  });

  it("appends api-key to query when addTo is query", async () => {
    await runRequest({
      method: "GET",
      url: "https://api.example.com/items",
      headers: [],
      body: { type: "none", content: "" },
      auth: {
        type: "api-key",
        key: "api_key",
        value: "secret",
        addTo: "query",
      },
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(init.body as string);
    expect(sent.url).toContain("api_key=");
    expect(sent.url).toContain("secret");
  });

  it("throws network RequestError when fetch rejects", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));

    await expect(
      runRequest({
        method: "GET",
        url: "https://x.test",
        headers: [],
        body: { type: "none", content: "" },
        auth: { type: "none" },
      }),
    ).rejects.toMatchObject({
      type: "network",
      message: "Failed to reach the proxy server",
    });
  });

  it("throws parse RequestError when proxy body is not JSON", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => {
        throw new SyntaxError("bad json");
      },
    });

    await expect(
      runRequest({
        method: "GET",
        url: "https://x.test",
        headers: [],
        body: { type: "none", content: "" },
        auth: { type: "none" },
      }),
    ).rejects.toMatchObject({
      type: "parse",
      message: "Failed to parse proxy response",
    });
  });

  it("throws proxy RequestError when response is not ok or payload has error", async () => {
    fetchMock.mockResolvedValueOnce(
      proxyJsonResponse(
        {
          status: 502,
          statusText: "Bad",
          headers: {},
          body: "",
          error: "upstream failed",
          code: "E_UPSTREAM",
        },
        { ok: false },
      ),
    );

    await expect(
      runRequest({
        method: "GET",
        url: "https://x.test",
        headers: [],
        body: { type: "none", content: "" },
        auth: { type: "none" },
      }),
    ).rejects.toMatchObject({
      type: "proxy",
      message: "upstream failed",
      cause: "E_UPSTREAM",
    });
  });

  it("passes AbortSignal to fetch", async () => {
    const ac = new AbortController();
    await runRequest(
      {
        method: "GET",
        url: "https://x.test",
        headers: [],
        body: { type: "none", content: "" },
        auth: { type: "none" },
      },
      ac.signal,
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBe(ac.signal);
  });
});

describe("runGraphQLRequest", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      proxyJsonResponse({
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("builds POST body with query, variables, and operationName", async () => {
    await runGraphQLRequest({
      url: "https://gql.test/graphql",
      headers: [],
      auth: { type: "none" },
      query: "{ __typename }",
      variablesJson: '{"id": 1}',
      operationName: "Op",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(init.body as string);
    expect(sent.method).toBe("POST");
    const gqlBody = JSON.parse(sent.body as string);
    expect(gqlBody.query).toBe("{ __typename }");
    expect(gqlBody.variables).toEqual({ id: 1 });
    expect(gqlBody.operationName).toBe("Op");
  });

  it("throws parse RequestError when variables JSON is not an object", async () => {
    await expect(
      runGraphQLRequest({
        url: "https://gql.test/graphql",
        headers: [],
        auth: { type: "none" },
        query: "{}",
        variablesJson: "[1,2]",
        operationName: "",
      }),
    ).rejects.toMatchObject({
      type: "parse",
      message: "Variables must be a JSON object",
    });
  });
});
