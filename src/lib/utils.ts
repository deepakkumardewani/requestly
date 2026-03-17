import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function interpolateVariables(
  template: string,
  env: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => env[key] ?? match);
}

export function parsePathParams(url: string): string[] {
  // Only look in the path portion (before ?)
  // Match :word but not :// (port/protocol colons are excluded since digits and / don't match [A-Za-z_])
  const pathPart = url.split("?")[0];
  return (pathPart.match(/:([A-Za-z_][A-Za-z0-9_]*)/g) ?? []).map((m) =>
    m.slice(1),
  );
}

export function parseQueryString(
  url: string,
): Array<{ key: string; value: string }> {
  try {
    const u = new URL(
      url.includes("://") ? url : `https://placeholder.com/${url}`,
    );
    return Array.from(u.searchParams.entries()).map(([key, value]) => ({
      key,
      value,
    }));
  } catch {
    return [];
  }
}

/**
 * Builds the final URL for sending/curl by substituting path params and appending query params.
 * Path params replace :paramName in the URL path; query params are appended after ?.
 */
export function buildFinalUrl(
  url: string,
  params: Array<{
    key: string;
    value: string;
    enabled: boolean;
    type?: "query" | "path";
  }>,
): string {
  const enabled = params.filter((p) => p.enabled && p.key);
  const pathParams = enabled.filter((p) => p.type === "path");
  const queryParams = enabled.filter((p) => p.type !== "path");

  let finalUrl = url.split("?")[0];

  for (const p of pathParams) {
    finalUrl = finalUrl.replace(`:${p.key}`, encodeURIComponent(p.value));
  }

  if (queryParams.length > 0) {
    const qs = queryParams
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join("&");
    finalUrl = `${finalUrl}?${qs}`;
  }

  return finalUrl;
}

export function buildUrlWithParams(
  baseUrl: string,
  params: Array<{ key: string; value: string; enabled: boolean }>,
): string {
  const enabledParams = params.filter((p) => p.enabled && p.key);
  if (enabledParams.length === 0) return baseUrl;

  try {
    const urlWithoutQuery = baseUrl.split("?")[0];
    const queryString = enabledParams
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join("&");
    return `${urlWithoutQuery}?${queryString}`;
  } catch {
    return baseUrl;
  }
}

export function truncateUrl(url: string, maxLength = 60): string {
  if (url.length <= maxLength) return url;
  return `${url.slice(0, maxLength)}…`;
}

export function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
