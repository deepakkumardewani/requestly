import { JSONPath } from "jsonpath-plus";

/** Extract a display variable name from a JSONPath, e.g. "$.data.token" → "token". */
export function jsonPathToVarName(path: string): string {
  const parts = path.replace(/^\$\.?/, "").split(".");
  return parts[parts.length - 1] || "value";
}

/**
 * Given a URL and a param name + extracted value, try to auto-replace a matching
 * static segment (or last numeric segment) with :paramName.
 * Returns the updated URL, or the original if nothing was replaced.
 */
export function autoReplaceUrlSegment(
  url: string,
  paramName: string,
  extractedValue: string | null,
): string {
  if (!paramName) return url;
  // Already has this placeholder — nothing to do
  if (url.includes(`:${paramName}`)) return url;

  // Try to match the extracted value exactly as a URL segment
  if (extractedValue) {
    const escaped = extractedValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exactPattern = new RegExp(`(/)${escaped}(/|$)`);
    if (exactPattern.test(url)) {
      return url.replace(exactPattern, `$1:${paramName}$2`);
    }
  }

  // Fallback: replace the last numeric or UUID-like segment
  const numericOrUuidPattern = /(\/)[a-f0-9-]{8,}(\/?$)|(\/)\d+(\/?$)/i;
  const match = url.match(numericOrUuidPattern);
  if (match) {
    return url.replace(numericOrUuidPattern, (_, p1, p2, p3, p4) => {
      const slash = p1 ?? p3;
      const trail = p2 ?? p4 ?? "";
      return `${slash}:${paramName}${trail}`;
    });
  }

  return url;
}

/** Resolve the actual value for a JSONPath from an already-parsed response. */
export function resolveJsonPathFromParsed(
  parsed: unknown,
  jsonPath: string,
): string | null {
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    !jsonPath ||
    !jsonPath.trim()
  ) {
    return null;
  }
  try {
    const result = JSONPath({ path: jsonPath, json: parsed });
    if (Array.isArray(result) && result.length > 0) return String(result[0]);
    return null;
  } catch {
    return null;
  }
}
