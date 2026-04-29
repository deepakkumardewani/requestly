import { describe, expect, it } from "vitest";
import type { BodyConfig, HttpTab } from "@/types";
import {
  estimateHeaderBlockBytes,
  estimateHttpTabRequestBytes,
  estimateKvHeadersBytes,
  estimateRequestBodyBytes,
} from "./responseMetrics";

describe("responseMetrics", () => {
  it("estimateHeaderBlockBytes sums CRLF-terminated header lines", () => {
    expect(estimateHeaderBlockBytes({ a: "1", b: "2" })).toBeGreaterThan(0);
    expect(estimateHeaderBlockBytes({})).toBe(0);
  });

  it("estimateKvHeadersBytes skips disabled or empty keys", () => {
    expect(
      estimateKvHeadersBytes([
        { id: "1", key: "A", value: "b", enabled: true },
        { id: "2", key: "", value: "x", enabled: true },
        { id: "3", key: "C", value: "d", enabled: false },
      ]),
    ).toBeGreaterThan(0);
  });

  it("estimateRequestBodyBytes handles none, json, urlencoded, and form-data", () => {
    const none: BodyConfig = { type: "none", content: "" };
    expect(estimateRequestBodyBytes(none)).toBe(0);

    const json: BodyConfig = { type: "json", content: "{}" };
    expect(estimateRequestBodyBytes(json)).toBeGreaterThan(0);

    const urlencoded: BodyConfig = {
      type: "urlencoded",
      content: "",
      formData: [
        { id: "1", key: "q", value: "a b", enabled: true },
        { id: "2", key: "x", value: "y", enabled: false },
      ],
    };
    expect(estimateRequestBodyBytes(urlencoded)).toBeGreaterThan(0);

    const multipart: BodyConfig = {
      type: "form-data",
      content: "",
      formData: [{ id: "1", key: "f", value: "v", enabled: true }],
    };
    expect(estimateRequestBodyBytes(multipart)).toBeGreaterThan(0);
  });

  it("estimateHttpTabRequestBytes adds auth headers and body size", () => {
    const tab: HttpTab = {
      tabId: "t1",
      requestId: null,
      name: "req",
      isDirty: false,
      type: "http",
      url: "https://example.com",
      method: "GET",
      headers: [{ id: "h1", key: "X-Test", value: "1", enabled: true }],
      params: [],
      body: { type: "json", content: "{}" },
      auth: {
        type: "bearer",
        token: "t",
      },
      preScript: "",
      postScript: "",
    };
    const out = estimateHttpTabRequestBytes(tab);
    expect(out.headers).toBeGreaterThan(0);
    expect(out.body).toBeGreaterThan(0);

    const basicTab: HttpTab = {
      ...tab,
      auth: {
        type: "basic",
        username: "u",
        password: "p",
      },
    };
    expect(estimateHttpTabRequestBytes(basicTab).headers).toBeGreaterThan(
      out.headers,
    );

    const apiKeyTab: HttpTab = {
      ...tab,
      auth: {
        type: "api-key",
        key: "X-Key",
        value: "v",
        addTo: "header",
      },
    };
    expect(estimateHttpTabRequestBytes(apiKeyTab).headers).toBeGreaterThan(0);
  });
});
