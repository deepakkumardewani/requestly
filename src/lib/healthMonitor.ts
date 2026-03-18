import type { HealthMetrics, HistoryEntry } from "@/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_PATTERN = /^\d+$/;

export const HEALTH_WINDOW = 50;
export const MIN_ENTRIES_FOR_METRICS = 5;

export function normaliseUrl(url: string): string {
  try {
    const u = new URL(url);
    const normPath = u.pathname
      .split("/")
      .map((seg) =>
        UUID_PATTERN.test(seg) || NUMERIC_PATTERN.test(seg) ? "{id}" : seg,
      )
      .join("/");
    return `${u.protocol}//${u.host}${normPath}`;
  } catch {
    return url;
  }
}

export function healthKey(method: string, url: string): string {
  return `${method.toUpperCase()}:${normaliseUrl(url)}`;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

export function computeHealthMetrics(
  entries: HistoryEntry[],
): HealthMetrics | null {
  if (entries.length < MIN_ENTRIES_FOR_METRICS) return null;

  // entries are newest-first; take window from the front
  const window = entries.slice(0, HEALTH_WINDOW);
  const successCount = window.filter(
    (e) => e.status >= 200 && e.status < 300,
  ).length;
  const sortedDurations = window.map((e) => e.duration).sort((a, b) => a - b);

  return {
    successRate: Math.round((successCount / window.length) * 100),
    p50: percentile(sortedDurations, 50),
    p95: percentile(sortedDurations, 95),
    lastStatus: window[0].status,
    entryCount: window.length,
  };
}

export function getEntriesForKey(
  entries: HistoryEntry[],
  key: string,
): HistoryEntry[] {
  return entries.filter((e) => healthKey(e.method, e.url) === key);
}
