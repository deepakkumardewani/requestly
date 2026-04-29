import { describe, expect, it } from "vitest";
import { migrateEdge } from "./chain";

describe("migrateEdge", () => {
  it("returns modern edges unchanged when injections has entries", () => {
    const edge = {
      id: "e1",
      sourceRequestId: "a",
      targetRequestId: "b",
      injections: [
        {
          sourceJsonPath: "$.token",
          targetField: "header" as const,
          targetKey: "Authorization",
        },
      ],
    };

    expect(migrateEdge(edge)).toBe(edge);
  });

  it("wraps legacy flat fields into a single injection with defaults", () => {
    const migrated = migrateEdge({
      id: "e1",
      sourceRequestId: "a",
      targetRequestId: "b",
      sourceJsonPath: "$.data.id",
      targetField: "body",
      targetKey: "$.userId",
    });

    expect(migrated).toEqual({
      id: "e1",
      sourceRequestId: "a",
      targetRequestId: "b",
      injections: [
        {
          sourceJsonPath: "$.data.id",
          targetField: "body",
          targetKey: "$.userId",
        },
      ],
    });
  });

  it("uses defaults when legacy optional fields are omitted", () => {
    const migrated = migrateEdge({
      id: "e2",
      sourceRequestId: "x",
      targetRequestId: "y",
    });

    expect(migrated.injections).toEqual([
      {
        sourceJsonPath: "$.value",
        targetField: "header",
        targetKey: "value",
      },
    ]);
  });

  it("preserves targetUrl and branchId when migrating legacy shape", () => {
    const migrated = migrateEdge({
      id: "e3",
      sourceRequestId: "a",
      targetRequestId: "b",
      targetUrl: "https://api.example.com/:id",
      branchId: "branch-1",
    });

    expect(migrated.targetUrl).toBe("https://api.example.com/:id");
    expect(migrated.branchId).toBe("branch-1");
    expect(migrated.injections).toHaveLength(1);
  });

  it("migrates when injections is empty array", () => {
    const migrated = migrateEdge({
      id: "e4",
      sourceRequestId: "a",
      targetRequestId: "b",
      injections: [],
      sourceJsonPath: "$.x",
    });

    expect(migrated.injections).toEqual([
      {
        sourceJsonPath: "$.x",
        targetField: "header",
        targetKey: "value",
      },
    ]);
  });

  it("defaults targetField to header when legacy targetField is undefined", () => {
    const migrated = migrateEdge({
      id: "e5",
      sourceRequestId: "a",
      targetRequestId: "b",
      sourceJsonPath: "$.onlyPath",
      targetKey: "k",
    });

    expect(migrated.injections?.[0]?.targetField).toBe("header");
  });
});
