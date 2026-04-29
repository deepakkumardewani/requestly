import fs, { type Dirent } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/hub", () => {
  const readdirSync = fs.readdirSync;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    fs.readdirSync = readdirSync;
  });

  it("returns directory names as slugs when hub dir is readable", async () => {
    const mockDir = vi.fn(
      (name: string): Partial<Dirent> => ({
        name,
        isDirectory: () => true,
      }),
    );

    vi.spyOn(fs, "readdirSync").mockImplementationOnce(() => [
      mockDir("alpha") as Dirent,
      mockDir("beta") as Dirent,
    ] as any);

    const res = await GET();
    expect(res.status).toBe(200);

    const data = (await res.json()) as { slugs: string[] };
    expect(data.slugs).toEqual(["alpha", "beta"]);
  });

  it("filters out files and returns only directories", async () => {
    vi.spyOn(fs, "readdirSync").mockImplementationOnce(() => [
      {
        name: "folder",
        isDirectory: () => true,
      } as Dirent,
      {
        name: "readme.json",
        isDirectory: () => false,
      } as Dirent,
    ] as any);

    const res = await GET();
    const data = (await res.json()) as { slugs: string[] };
    expect(data.slugs).toEqual(["folder"]);
  });

  it("returns empty slugs when readdir fails (missing dir or permission)", async () => {
    vi.spyOn(fs, "readdirSync").mockImplementationOnce((() => {
      throw new Error("ENOENT");
    }) as any);

    const res = await GET();
    expect(res.status).toBe(200);

    const data = (await res.json()) as { slugs: string[] };
    expect(data.slugs).toEqual([]);
  });
});
