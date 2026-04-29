import { describe, expect, it } from "vitest";
import { runJs, runJsonPath } from "./transformRunner";

const sampleResponse = {
  json: { id: 99 },
  text: '{"id":99}',
  status: 200,
  headers: {},
};

describe("runJsonPath", () => {
  it("returns error when body is not JSON", async () => {
    await expect(runJsonPath("$.id", "x")).resolves.toEqual({
      error: "JSONPath requires a JSON response",
    });
  });

  it("normalizes path without leading $", async () => {
    await expect(runJsonPath("id", '{"id":7}')).resolves.toEqual({
      output: JSON.stringify([7], null, 2),
    });
  });

  it("returns empty array string when no match", async () => {
    await expect(runJsonPath("$.missing", '{"a":1}')).resolves.toEqual({
      output: "[]",
    });
  });
});

describe("runJs", () => {
  it("returns stringified evaluation result", async () => {
    const out = await runJs("id", sampleResponse);
    expect(out).toEqual({ output: JSON.stringify(99, null, 2) });
  });

  it("auto-prefixes simple property path", async () => {
    const out = await runJs("code", {
      ...sampleResponse,
      json: { code: "ok" },
      text: "",
    });
    expect(out).toEqual({ output: JSON.stringify("ok", null, 2) });
  });

  it("returns execution error on thrown exception", async () => {
    const out = await runJs("throw new Error('nope');", sampleResponse);
    expect(out).toEqual({ error: "nope" });
  });

  it("returns full json when script blank", async () => {
    const out = await runJs("", sampleResponse);
    expect(out).toEqual({
      output: JSON.stringify(sampleResponse.json, null, 2),
    });
  });
});
