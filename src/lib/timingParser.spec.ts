import { describe, expect, it } from "vitest";
import { parseTimingHeaders } from "./timingParser";

describe("parseTimingHeaders", () => {
  it("uses x-timing-* headers when all three are present", () => {
    expect(
      parseTimingHeaders(
        {
          "x-timing-ttfb": "12.5",
          "x-timing-download": "3.5",
          "x-timing-total": "16",
        },
        999,
      ),
    ).toEqual({
      dns: null,
      tcp: null,
      tls: null,
      ttfb: 12.5,
      download: 3.5,
      total: 16,
    });
  });

  it("falls back to proportional split when any timing header missing", () => {
    expect(parseTimingHeaders({}, 100)).toEqual({
      dns: null,
      tcp: null,
      tls: null,
      ttfb: 80,
      download: 20,
      total: 100,
    });
    expect(parseTimingHeaders({ "x-timing-ttfb": "1" }, 50)).toEqual({
      dns: null,
      tcp: null,
      tls: null,
      ttfb: 40,
      download: 10,
      total: 50,
    });
  });
});
