import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  runPostScript,
  runPreScript,
  type ScriptRequestContext,
} from "./scriptRunner";

vi.mock("@/lib/utils", () => ({
  generateId: vi.fn(() => "id-mock"),
}));

describe("runPreScript", () => {
  const baseRequest: ScriptRequestContext = {
    url: "https://a.test",
    method: "GET",
    headers: [{ id: "h1", key: "X-Old", value: "1", enabled: true }],
    body: { type: "json", content: "{}" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no error and echoes request when script is empty", () => {
    const env = { store: {} as Record<string, string> };
    const out = runPreScript(
      "   ",
      baseRequest,
      (k) => env.store[k],
      (k, v) => {
        env.store[k] = v;
      },
    );
    expect(out.error).toBeUndefined();
    expect(out.logs).toEqual([]);
    expect(out.requestOverrides?.url).toBe("https://a.test");
  });

  it("captures console output and mutations to request", () => {
    const env = { store: {} as Record<string, string> };
    const script = `
      console.log("hi", { a: 1 });
      console.warn("w");
      requestly.request.url.set("https://b.test");
      requestly.request.headers.set("X-Old", "2");
      requestly.request.headers.set("X-New", "3");
      requestly.request.body.set("{}");
    `;
    const out = runPreScript(
      script,
      baseRequest,
      (k) => env.store[k],
      (k, v) => {
        env.store[k] = v;
      },
    );
    expect(out.error).toBeUndefined();
    expect(out.logs[0]).toContain("hi");
    expect(out.logs[1]).toMatch(/^\[warn\]/);
    expect(out.requestOverrides?.url).toBe("https://b.test");
    const headers = out.requestOverrides?.headers ?? [];
    expect(headers.find((h) => h.key === "X-Old")?.value).toBe("2");
    expect(headers.find((h) => h.key === "X-New")?.value).toBe("3");
    expect(out.requestOverrides?.body?.content).toBe("{}");
  });

  it("returns script error message when evaluation throws", () => {
    const out = runPreScript(
      "throw new Error('boom');",
      baseRequest,
      () => undefined,
      () => {},
    );
    expect(out.error).toBe("boom");
    expect(out.logs).toEqual([]);
  });

  it("isolates env helpers from outer scope", () => {
    const env = { store: {} as Record<string, string> };
    runPreScript(
      'requestly.environment.set("K", "v"); console.log(requestly.environment.get("K"));',
      baseRequest,
      (k) => env.store[k],
      (k, v) => {
        env.store[k] = v;
      },
    );
    expect(env.store.K).toBe("v");
  });
});

describe("runPostScript", () => {
  const response = {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    body: '{"x":true}',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes response helpers and parses JSON", () => {
    const out = runPostScript(
      "const j = requestly.response.json(); console.log(j.x);",
      response,
      () => undefined,
      () => {},
    );
    expect(out.error).toBeUndefined();
    expect(out.logs).toEqual(["true"]);
  });

  it("reads headers case-insensitively", () => {
    const out = runPostScript(
      'console.log(requestly.response.headers.get("Content-Type"));',
      response,
      () => undefined,
      () => {},
    );
    expect(out.logs).toEqual(["application/json"]);
  });

  it("returns error when script throws", () => {
    const out = runPostScript(
      "requestly.response.json(",
      response,
      () => undefined,
      () => {},
    );
    expect(out.error).toBeTruthy();
  });
});
