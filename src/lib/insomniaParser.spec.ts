import { describe, expect, it } from "vitest";
import {
  InsomniaParseError,
  isInsomniaExport,
  parseInsomnia,
} from "./insomniaParser";

function minimalRequest(
  id: string,
  parentId: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    _id: id,
    _type: "request",
    parentId,
    name: "R1",
    method: "GET",
    url: "https://example.com",
    headers: [],
    ...overrides,
  };
}

describe("isInsomniaExport", () => {
  it("returns true only for export shape", () => {
    expect(isInsomniaExport({ _type: "export", resources: [] })).toBe(true);
    expect(
      isInsomniaExport({
        _type: "export",
        resources: "bad" as unknown as unknown[],
      }),
    ).toBe(false);
    expect(isInsomniaExport({ _type: "other" })).toBe(false);
  });
});

describe("parseInsomnia", () => {
  it("throws when not an export", () => {
    expect(() => parseInsomnia({ _type: "workspace", resources: [] })).toThrow(
      InsomniaParseError,
    );
  });

  it("throws when no requests", () => {
    expect(() =>
      parseInsomnia({
        _type: "export",
        resources: [{ _type: "workspace", _id: "w1", name: "W" }],
      }),
    ).toThrow(/No requests found/);
  });

  it("groups requests by parent and parses bodies and auth", () => {
    const data = {
      _type: "export",
      resources: [
        { _type: "workspace", _id: "w1", name: "API" },
        { _type: "request_group", _id: "g1", name: "Folder A", parentId: "w1" },
        minimalRequest("r1", "g1", {
          method: "post",
          url: "https://x.test",
          headers: [{ name: "H", value: "v", disabled: false }],
          body: { mimeType: "application/json", text: '{"x":1}' },
          authentication: { type: "bearer", token: "t" },
        }),
      ],
    };
    const cols = parseInsomnia(data as Record<string, unknown>);
    expect(cols).toHaveLength(1);
    expect(cols[0].name).toBe("Folder A");
    expect(cols[0].requests[0].method).toBe("POST");
    expect(cols[0].requests[0].auth).toEqual({ type: "bearer", token: "t" });
    expect(cols[0].requests[0].body.type).toBe("json");
  });

  it("parses urlencoded body params", () => {
    const data = {
      _type: "export",
      resources: [
        { _type: "workspace", _id: "w1", name: "W" },
        minimalRequest("r1", "w1", {
          body: {
            mimeType: "application/x-www-form-urlencoded",
            params: [
              { name: "a", value: "1", disabled: false },
              { name: "b", value: "2", disabled: true },
            ],
          },
        }),
      ],
    };
    const cols = parseInsomnia(data as Record<string, unknown>);
    expect(cols[0].requests[0].body.type).toBe("urlencoded");
    if (cols[0].requests[0].body.type === "urlencoded") {
      expect(cols[0].requests[0].body.content).toBe("a=1");
    }
  });

  it("filters disabled headers", () => {
    const data = {
      _type: "export",
      resources: [
        { _type: "workspace", _id: "w1", name: "W" },
        minimalRequest("r1", "w1", {
          headers: [
            { name: "A", value: "1", disabled: true },
            { name: "B", value: "2" },
          ],
        }),
      ],
    };
    const cols = parseInsomnia(data as Record<string, unknown>);
    expect(cols[0].requests[0].headers.map((h) => h.key)).toEqual(["B"]);
  });
});
