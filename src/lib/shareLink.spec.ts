import { afterEach, describe, expect, it, vi } from "vitest";
import type { HttpTab } from "@/types";
import { encryptPayload } from "./crypto";
import { createShareLink, fetchSharePayload } from "./shareLink";

function minimalHttpTab(overrides: Partial<HttpTab> = {}): HttpTab {
  return {
    tabId: "t1",
    requestId: null,
    name: "Test",
    isDirty: false,
    type: "http",
    method: "GET",
    url: "https://example.com",
    headers: [],
    params: [],
    auth: { type: "none" },
    body: { type: "none", content: "" },
    preScript: "",
    postScript: "",
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createShareLink", () => {
  it("returns null when userId is empty", async () => {
    const tab = minimalHttpTab();
    await expect(createShareLink(tab, "")).resolves.toBeNull();
  });

  it("returns null when window is not available (SSR / Node)", async () => {
    const tab = minimalHttpTab();
    await expect(createShareLink(tab, "user-1")).resolves.toBeNull();
  });

  it("returns a well-formed share URL and POSTs ciphertext to /api/share", async () => {
    const post = vi
      .fn()
      .mockImplementation((_url: string, init: RequestInit) => {
        const body = init.body;
        if (typeof body === "string") {
          const parsed: { ciphertext: string; iv: string; userId: string } =
            JSON.parse(body) as {
              ciphertext: string;
              iv: string;
              userId: string;
            };
          expect(parsed.userId).toBe("anon-xyz");
          expect(parsed.ciphertext.length).toBeGreaterThan(0);
          expect(parsed.iv.length).toBeGreaterThan(0);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "Xy7k2m9a" }),
        });
      });

    vi.stubGlobal("window", {
      location: { origin: "https://app.test" },
      fetch: post,
    } as unknown as Window & typeof globalThis);

    const url = await createShareLink(minimalHttpTab(), "anon-xyz");
    expect(url).not.toBeNull();
    if (url === null) {
      throw new Error("expected non-null share URL");
    }
    expect(url).toMatch(/^https:\/\/app\.test\/\?s=Xy7k2m9a#[A-Za-z0-9+/=]+$/);
    expect(post).toHaveBeenCalledWith(
      "/api/share",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
});

describe("fetchSharePayload", () => {
  it("returns null when window is not available", async () => {
    await expect(fetchSharePayload("anyId")).resolves.toBeNull();
  });

  it("returns null when location hash is missing the key", async () => {
    vi.stubGlobal("window", {
      location: { hash: "" },
      fetch: vi.fn(),
    } as unknown as Window & typeof globalThis);
    await expect(fetchSharePayload("x")).resolves.toBeNull();
  });

  it("round-trips decrypt and validates ShareRequestSchema", async () => {
    const tab = minimalHttpTab({ method: "POST", url: "https://a.test/x" });
    const payload = {
      method: tab.method,
      url: tab.url,
      headers: tab.headers,
      params: tab.params,
      body: tab.body,
      auth: tab.auth,
    };
    const plaintext = JSON.stringify(payload);
    const { ciphertext, iv, keyB64 } = await encryptPayload(plaintext);

    const get = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ciphertext, iv }),
    });

    vi.stubGlobal("window", {
      location: {
        hash: `#${keyB64}`,
      },
      fetch: get,
    } as unknown as Window & typeof globalThis);

    const out = await fetchSharePayload("shareId1");
    expect(get).toHaveBeenCalledWith("/api/share/shareId1");
    expect(out).not.toBeNull();
    if (out === null) {
      throw new Error("expected payload");
    }
    expect(out.method).toBe("POST");
    expect(out.url).toBe("https://a.test/x");
  });

  it("returns null when GET is not ok", async () => {
    vi.stubGlobal("window", {
      location: { hash: `#${"x".repeat(10)}` },
      fetch: vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    } as unknown as Window & typeof globalThis);
    await expect(fetchSharePayload("missing")).resolves.toBeNull();
  });
});
