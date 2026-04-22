export interface BuildJsonPathSuggestionsOptions {
  /** Maximum tree depth to traverse when enqueueing children (root depth is 0). Default 8. */
  maxDepth?: number;
  /** Maximum number of distinct paths to return. Default 500. */
  maxPaths?: number;
  /** Max numeric indices to emit per array (`[0]`, `[1]`, …). Default 2. */
  maxArrayNumericSamples?: number;
}

export interface BuildJsonPathSuggestionsFromTextOptions
  extends BuildJsonPathSuggestionsOptions {
  /** When `text` is not valid JSON, max keys to take from regex scan. Default 3. */
  maxKeysFromFallback?: number;
}

const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_MAX_PATHS = 500;
const DEFAULT_MAX_ARRAY_NUMERIC_SAMPLES = 2;
const DEFAULT_MAX_KEYS_FALLBACK = 3;
const JSON_LIKE_SNIPPET_LEN = 5000;

interface QueueItem {
  pathPrefix: string;
  value: unknown;
  depth: number;
}

function segmentCount(path: string): number {
  if (!path) return 0;
  const dots = path.match(/\./g)?.length ?? 0;
  const brackets = path.match(/\[/g)?.length ?? 0;
  return 1 + dots + brackets;
}

function sortPathsShallowFirst(paths: string[]): string[] {
  return [...paths].sort((a, b) => {
    const da = segmentCount(a);
    const db = segmentCount(b);
    if (da !== db) return da - db;
    return a.localeCompare(b);
  });
}

/**
 * Suggest JSONPath-style path suffixes (no leading `$`) from a parsed JSON value.
 * Shallow paths are listed first; output is deduped and capped.
 */
export function buildJsonPathSuggestions(
  value: unknown,
  options?: BuildJsonPathSuggestionsOptions,
): string[] {
  const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxPaths = options?.maxPaths ?? DEFAULT_MAX_PATHS;
  const maxArrayNumericSamples =
    options?.maxArrayNumericSamples ?? DEFAULT_MAX_ARRAY_NUMERIC_SAMPLES;

  if (value === null || typeof value !== "object") {
    return [];
  }

  const seen = new WeakSet<object>();
  const dedupe = new Set<string>();

  function add(path: string) {
    if (dedupe.size >= maxPaths) return;
    dedupe.add(path);
  }

  const queue: QueueItem[] = [{ pathPrefix: "", value, depth: 0 }];

  while (queue.length > 0 && dedupe.size < maxPaths) {
    const item = queue.shift();
    if (item === undefined) break;
    const { pathPrefix, value: node, depth } = item;

    if (node === null || typeof node !== "object") continue;
    if (seen.has(node)) continue;
    seen.add(node);

    if (Array.isArray(node)) {
      const wildcardPath = pathPrefix === "" ? "[*]" : `${pathPrefix}[*]`;
      add(wildcardPath);

      const sampleCount = Math.min(maxArrayNumericSamples, node.length);
      for (let i = 0; i < sampleCount; i++) {
        const idxPath = pathPrefix === "" ? `[${i}]` : `${pathPrefix}[${i}]`;
        add(idxPath);
      }

      if (node.length > 0 && depth < maxDepth) {
        queue.push({
          pathPrefix: wildcardPath,
          value: node[0],
          depth: depth + 1,
        });
      }
      continue;
    }

    const record = node as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const nextPath = pathPrefix === "" ? key : `${pathPrefix}.${key}`;
      add(nextPath);

      if (depth < maxDepth) {
        const child = record[key];
        if (child !== null && typeof child === "object") {
          queue.push({
            pathPrefix: nextPath,
            value: child,
            depth: depth + 1,
          });
        }
      }
    }
  }

  return sortPathsShallowFirst([...dedupe]);
}

/**
 * Top-level object keys from a JSON-like string (invalid JSON ok), mirroring
 * Transform placeholder heuristics: first {@link JSON_LIKE_SNIPPET_LEN} chars,
 * keys matching `"name":` pattern.
 */
export function extractTopLevelKeysFromJsonLikeText(
  text: string,
  maxKeys: number,
): string[] {
  const snippet = text.slice(0, JSON_LIKE_SNIPPET_LEN).trim();
  const keys: string[] = [];
  const regex = /"([a-zA-Z0-9_]+)"\s*:/g;
  let match: RegExpExecArray | null = regex.exec(snippet);
  while (match !== null && keys.length < maxKeys) {
    const key = match[1];
    if (key !== undefined && !keys.includes(key)) {
      keys.push(key);
    }
    match = regex.exec(snippet);
  }
  return keys;
}

/**
 * Parse JSON when possible; otherwise return regex-extracted top-level keys as paths.
 */
export function buildJsonPathSuggestionsFromText(
  text: string,
  options?: BuildJsonPathSuggestionsFromTextOptions,
): string[] {
  try {
    return buildJsonPathSuggestions(JSON.parse(text), options);
  } catch {
    const maxKeys = options?.maxKeysFromFallback ?? DEFAULT_MAX_KEYS_FALLBACK;
    return extractTopLevelKeysFromJsonLikeText(text, maxKeys);
  }
}
