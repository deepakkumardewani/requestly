import { beforeEach, describe, expect, it, vi } from "vitest";

const bulkImportCollection = vi.fn();
const importEnv = vi.fn();

vi.mock("@/stores/useCollectionsStore", () => ({
  useCollectionsStore: {
    getState: () => ({
      bulkImportCollection,
    }),
  },
}));

vi.mock("@/stores/useEnvironmentsStore", () => ({
  useEnvironmentsStore: {
    getState: () => ({
      importEnv,
    }),
  },
}));

vi.mock("@/lib/utils", () => ({
  generateId: vi.fn(() => "gen-test-id"),
}));

import type { HubCollection, HubEnvironment, HubMeta } from "@/types/hub";
import { getImportedSlugs, importHubEntry, markSlugImported } from "./hub";

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
  } as Storage;
}

describe("getImportedSlugs", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
  });

  it("returns empty set when key missing", () => {
    expect(getImportedSlugs().size).toBe(0);
  });

  it("parses stored JSON array of slugs", () => {
    localStorage.setItem(
      "requestly_imported_hub_slugs",
      JSON.stringify(["a", "b"]),
    );
    expect([...getImportedSlugs()].sort()).toEqual(["a", "b"]);
  });

  it("returns empty set on invalid JSON", () => {
    localStorage.setItem("requestly_imported_hub_slugs", "{");
    expect(getImportedSlugs().size).toBe(0);
  });
});

describe("markSlugImported", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
  });

  it("merges new slug with existing slugs", () => {
    markSlugImported("one");
    markSlugImported("two");
    const raw = localStorage.getItem("requestly_imported_hub_slugs");
    expect(JSON.parse(raw as string).sort()).toEqual(["one", "two"]);
  });
});

describe("importHubEntry", () => {
  const meta: HubMeta = {
    name: "Hub Name",
    providerName: "p",
    description: "d",
    category: "c",
    logoUrl: "",
    docsUrl: "",
  };

  const hubCollection: HubCollection = {
    id: "hc1",
    name: "C",
    requests: [
      {
        id: "r1",
        name: "Req",
        method: "POST",
        url: "https://h.test/r",
        headers: [{ key: "H", value: "v", enabled: true }],
        params: [],
        body: { type: "json", content: "{}" },
      },
    ],
    createdAt: 1,
  };

  const hubEnv: HubEnvironment = {
    id: "he1",
    name: "E",
    variables: [{ key: "TOKEN", value: "x", secret: true }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", memoryStorage());
  });

  it("imports collection and environment then marks slug", () => {
    importHubEntry("my-slug", hubCollection, hubEnv, meta);

    expect(bulkImportCollection).toHaveBeenCalledTimes(1);
    const [collection, requests] = bulkImportCollection.mock.calls[0];
    expect(collection.name).toBe("Hub Name");
    expect(collection.description).toBeUndefined();
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("POST");
    expect(requests[0].url).toBe("https://h.test/r");
    expect(requests[0].collectionId).toBe("gen-test-id");

    expect(importEnv).toHaveBeenCalledTimes(1);
    const [env] = importEnv.mock.calls[0];
    expect(env.name).toBe("Hub Name");
    expect(env.variables[0].key).toBe("TOKEN");
    expect(env.variables[0].isSecret).toBe(true);

    const slugs = localStorage.getItem("requestly_imported_hub_slugs");
    expect(JSON.parse(slugs as string)).toContain("my-slug");
  });
});
