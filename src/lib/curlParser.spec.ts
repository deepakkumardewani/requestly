import { describe, expect, it } from "vitest";
import { CurlParseError, parseCurl } from "./curlParser";

describe("parseCurl", () => {
  it("parses GET with URL and infers method", () => {
    const out = parseCurl(`curl 'https://example.com/path'`);
    expect(out.method).toBe("GET");
    expect(out.url).toBe("https://example.com/path");
    expect(out.body.type).toBe("none");
  });

  it("parses -X POST and JSON body with content-type", () => {
    const out = parseCurl(
      `curl -X POST 'https://api.test/x' -H 'Content-Type: application/json' -d '{"a":1}'`,
    );
    expect(out.method).toBe("POST");
    expect(out.body).toEqual({ type: "json", content: '{"a":1}' });
  });

  it("infers POST when body present without explicit method", () => {
    const out = parseCurl(`curl 'https://x.test' -d 'plain'`);
    expect(out.method).toBe("POST");
    expect(out.body.type).toBe("text");
  });

  it("parses -H headers and Bearer from Authorization", () => {
    const out = parseCurl(
      `curl 'https://x.test' -H 'Authorization: Bearer tok' -H 'X-Custom: 1'`,
    );
    expect(out.auth).toEqual({ type: "bearer", token: "tok" });
    expect(out.headers.map((h) => h.key)).toEqual(
      expect.arrayContaining(["X-Custom"]),
    );
  });

  it("parses basic auth -u user:pass", () => {
    const out = parseCurl(`curl -u 'alice:secret' 'https://x.test'`);
    expect(out.auth).toEqual({
      type: "basic",
      username: "alice",
      password: "secret",
    });
  });

  it("parses --data-urlencode into urlencoded body", () => {
    const out = parseCurl(
      `curl 'https://x.test' --data-urlencode 'a=b' --data-urlencode 'c=d'`,
    );
    expect(out.body.type).toBe("urlencoded");
    if (out.body.type === "urlencoded") {
      expect(out.body.content).toContain("a=b");
      expect(out.body.formData?.length).toBe(2);
    }
  });

  it("joins line continuations", () => {
    const out = parseCurl(`curl https://a.test \\
  -H 'X: 1'`);
    expect(out.url).toBe("https://a.test");
  });

  it("respects boolean flags without consuming next token as URL", () => {
    const out = parseCurl(`curl -L -k https://secure.test`);
    expect(out.url).toBe("https://secure.test");
  });

  it("throws when input does not start with curl", () => {
    expect(() => parseCurl(`wget x`)).toThrow(CurlParseError);
  });

  it("throws on unknown method", () => {
    expect(() => parseCurl(`curl -X TEAPOT https://x.test`)).toThrow(
      CurlParseError,
    );
  });

  it("throws when URL missing", () => {
    expect(() => parseCurl(`curl -X GET`)).toThrow(CurlParseError);
  });

  it("throws on malformed header", () => {
    expect(() => parseCurl(`curl https://x.test -H 'BadHeader'`)).toThrow(
      CurlParseError,
    );
  });
});
