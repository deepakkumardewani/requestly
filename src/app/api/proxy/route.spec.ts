import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PROXY_RESPONSE_BYTES } from "@/lib/constants";
import { POST } from "./route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/proxy", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns 400 when body is not valid JSON", async () => {
    const req = new Request("http://localhost/api/proxy", {
      method: "POST",
      body: "not-json{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("INVALID_PAYLOAD");
  });

  it("returns 400 when url is missing", async () => {
    const res = await POST(jsonRequest({ method: "GET" }));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("MISSING_URL");
  });

  it("returns 400 when url is invalid", async () => {
    const res = await POST(jsonRequest({ url: "not a url", method: "GET" }));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("INVALID_URL");
  });

  it("proxies a valid request and returns status, headers, body, and timing headers", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response("hello", {
        status: 201,
        statusText: "Created",
        headers: {
          "Content-Type": "text/plain",
          "X-Upstream": "1",
        },
      }),
    );

    const res = await POST(
      jsonRequest({
        url: "https://example.com/path",
        method: "get",
        headers: { Authorization: "Bearer x" },
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Timing-TTFB")).toBeTruthy();
    expect(res.headers.get("X-Timing-Download")).toBeTruthy();
    expect(res.headers.get("X-Timing-Total")).toBeTruthy();

    const data = (await res.json()) as {
      status: number;
      statusText: string;
      body: string;
      headers: Record<string, string>;
    };

    expect(data.status).toBe(201);
    expect(data.statusText).toBe("Created");
    expect(data.body).toBe("hello");
    expect(data.headers["content-type"]).toContain("text/plain");
    expect(data.headers["x-upstream"]).toBe("1");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://example.com/path",
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer x" },
        redirect: "follow",
      }),
    );
  });

  it("sends redirect manual when followRedirects is false", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response(""));

    await POST(
      jsonRequest({
        url: "https://example.com/",
        method: "POST",
        followRedirects: false,
      }),
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://example.com/",
      expect.objectContaining({
        redirect: "manual",
      }),
    );
  });

  it("returns 413 when Content-Length exceeds limit", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response("", {
        status: 200,
        headers: {
          "content-length": String(MAX_PROXY_RESPONSE_BYTES + 1),
        },
      }),
    );

    const res = await POST(
      jsonRequest({ url: "https://example.com/big", method: "GET" }),
    );

    expect(res.status).toBe(413);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("RESPONSE_TOO_LARGE");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("returns 413 when actual body exceeds limit after read", async () => {
    const huge = "z".repeat(MAX_PROXY_RESPONSE_BYTES + 1);
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(huge, {
        status: 200,
        headers: {},
      }),
    );

    const res = await POST(
      jsonRequest({ url: "https://example.com/stream", method: "GET" }),
    );

    expect(res.status).toBe(413);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("RESPONSE_TOO_LARGE");
  });

  it("returns 502 when fetch throws", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(
      new Error("ECONNREFUSED"),
    );

    const res = await POST(
      jsonRequest({ url: "https://example.com/offline", method: "GET" }),
    );

    expect(res.status).toBe(502);
    const data = (await res.json()) as { code: string; error: string };
    expect(data.code).toBe("UPSTREAM_ERROR");
    expect(data.error).toContain("ECONNREFUSED");
  });

  it("returns 502 when fetch throws a non-Error value", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce("boom");

    const res = await POST(
      jsonRequest({ url: "https://example.com/", method: "GET" }),
    );

    expect(res.status).toBe(502);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("UPSTREAM_ERROR");
  });
});
