import type { TimingData } from "@/types";

// DNS, TCP, TLS are not measurable from a server-side Node.js fetch.
// We read TTFB and Download from custom proxy headers; fall back to
// proportional estimates when the headers are absent (e.g. direct fetch).
export function parseTimingHeaders(
  headers: Record<string, string>,
  totalDuration: number,
): TimingData {
  const rawTtfb = headers["x-timing-ttfb"];
  const rawDownload = headers["x-timing-download"];
  const rawTotal = headers["x-timing-total"];

  if (
    rawTtfb !== undefined &&
    rawDownload !== undefined &&
    rawTotal !== undefined
  ) {
    return {
      dns: null,
      tcp: null,
      tls: null,
      ttfb: parseFloat(rawTtfb),
      download: parseFloat(rawDownload),
      total: parseFloat(rawTotal),
    };
  }

  // Fallback: estimate from total client-side duration
  return {
    dns: null,
    tcp: null,
    tls: null,
    ttfb: totalDuration * 0.8,
    download: totalDuration * 0.2,
    total: totalDuration,
  };
}
