import { describe, expect, it } from "vitest";
import type { EnvironmentModel, HttpTab, KVPair } from "@/types";
import {
  generateAxios,
  generateCSharp,
  generateCurl,
  generateFetch,
  generateGo,
  generateJava,
  generatePHP,
  generatePython,
  generateRuby,
  resolveTabStateVars,
} from "./codeGenerators";

function pair(
  key: string,
  value: string,
  opts: { enabled?: boolean; type?: "path" | "query" } = {},
): KVPair {
  return {
    id: `id-${key}`,
    key,
    value,
    enabled: opts.enabled ?? true,
    ...(opts.type ? { type: opts.type } : {}),
  };
}

function baseTab(overrides: Partial<HttpTab> = {}): HttpTab {
  return {
    tabId: "t1",
    requestId: null,
    name: "T",
    isDirty: false,
    type: "http",
    method: "GET",
    url: "https://api.example.com/items/:id",
    headers: [],
    params: [
      pair("id", "42", { type: "path" }),
      pair("q", "hello", { type: "query" }),
    ],
    auth: { type: "none" },
    body: { type: "none", content: "" },
    preScript: "",
    postScript: "",
    ...overrides,
  };
}

describe("resolveTabStateVars", () => {
  it("returns tab unchanged when env is null", () => {
    const tab = baseTab();
    expect(resolveTabStateVars(tab, null)).toBe(tab);
  });

  it("substitutes values and redacts secrets", () => {
    const env: EnvironmentModel = {
      id: "e1",
      name: "E",
      variables: [
        {
          id: "v1",
          key: "TOKEN",
          initialValue: "init",
          currentValue: "sekret",
          isSecret: true,
        },
        {
          id: "v2",
          key: "HOST",
          initialValue: "",
          currentValue: "https://x.test",
          isSecret: false,
        },
      ],
      createdAt: 0,
      updatedAt: 0,
    };
    const tab = baseTab({
      url: "{{HOST}}/v1",
      headers: [pair("Authorization", "Bearer {{TOKEN}}")],
      auth: { type: "bearer", token: "{{TOKEN}}" },
    });
    const out = resolveTabStateVars(tab, env);
    expect(out.url).toBe("https://x.test/v1");
    expect(out.headers[0].value).toBe("Bearer <REDACTED>");
    expect(out.auth).toEqual({ type: "bearer", token: "<REDACTED>" });
  });
});

describe("generateFetch", () => {
  it("uses one-liner for plain GET", () => {
    const s = generateFetch(baseTab());
    expect(s).toContain(
      "await fetch('https://api.example.com/items/42?q=hello');",
    );
  });

  it("includes headers and JSON body for POST", () => {
    const s = generateFetch(
      baseTab({
        method: "POST",
        body: { type: "json", content: '{"a":1}' },
      }),
    );
    expect(s).toContain("method: 'POST'");
    expect(s).toContain("Content-Type");
    expect(s).toContain('"{\\"a\\":1}"');
  });
});

describe("generateAxios", () => {
  it("lowercases method and omits data for GET", () => {
    const s = generateAxios(baseTab());
    expect(s).toContain("method: 'get'");
    expect(s).not.toContain("data:");
  });
});

describe("generatePython", () => {
  it("uses json= when body is valid JSON", () => {
    const s = generatePython(
      baseTab({
        method: "POST",
        body: { type: "json", content: '{"x": 1}' },
      }),
    );
    expect(s).toContain("json=");
  });

  it("falls back to data= for non-JSON body string", () => {
    const s = generatePython(
      baseTab({
        method: "POST",
        body: { type: "text", content: "not-json" },
      }),
    );
    expect(s).toContain("data=");
  });
});

describe("generateRuby", () => {
  it("requires json only for JSON POST bodies", () => {
    const s = generateRuby(
      baseTab({
        method: "POST",
        body: { type: "json", content: "{}" },
      }),
    );
    expect(s).toContain("require 'json'");
  });
});

describe("generateJava", () => {
  it("uses GET() shortcut for GET requests", () => {
    const s = generateJava(baseTab());
    expect(s).toContain(".GET()");
  });

  it("uses explicit method with body for POST", () => {
    const s = generateJava(
      baseTab({
        method: "POST",
        body: { type: "json", content: "{}" },
      }),
    );
    expect(s).toContain('.method("POST"');
  });
});

describe("generateCSharp", () => {
  it("uses GetAsync for GET", () => {
    expect(generateCSharp(baseTab())).toContain("GetAsync");
  });

  it("uses DeleteAsync for DELETE without body", () => {
    expect(generateCSharp(baseTab({ method: "DELETE" }))).toContain(
      "DeleteAsync",
    );
  });

  it("uses PatchAsync for PATCH with body", () => {
    expect(
      generateCSharp(
        baseTab({
          method: "PATCH",
          body: { type: "json", content: '{"a":true}' },
        }),
      ),
    ).toContain("PatchAsync");
  });
});

describe("generatePHP and generateGo", () => {
  it("emit CURLOPT_CUSTOMREQUEST and net/http patterns", () => {
    expect(generatePHP(baseTab({ method: "PUT" }))).toContain(
      "CURLOPT_CUSTOMREQUEST",
    );
    expect(generateGo(baseTab())).toContain('http.NewRequest("GET"');
  });
});

describe("generateCurl (re-export)", () => {
  it("includes method and final URL with resolved params", () => {
    const s = generateCurl(baseTab());
    expect(s).toContain("curl -X GET");
    expect(s).toContain("items/42");
    expect(s).toContain("q=hello");
  });
});
