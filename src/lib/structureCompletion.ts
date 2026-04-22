/**
 * Ref-fed JSON structure completions for CodeEditor (JSONPath suffixes / JS fragments).
 * Paths omit a leading `$`; they align with transformRunner’s implicit `$.` prefix.
 */

export type StructureCompletionMode = "jsonpath" | "js";

export type StructureCompletionState = {
  mode: StructureCompletionMode;
  paths: string[];
};

/** Same-line `//` heuristic: suppress noise in comments. */
export function shouldSuppressStructureCompletion(linePrefix: string): boolean {
  return linePrefix.includes("//");
}

/**
 * Filter paths by case-insensitive prefix; `apply` is the suffix after the typed prefix.
 */
export function buildStructurePathCompletionOptions(
  paths: string[],
  typedPrefix: string,
): Array<{ label: string; apply: string; detail: string }> {
  const lower = typedPrefix.toLowerCase();
  const filtered = paths.filter((p) => p.toLowerCase().startsWith(lower));
  return filtered.map((path) => ({
    label: path,
    apply: path.slice(typedPrefix.length),
    detail: "from JSON",
  }));
}

const PATH_TOKEN = /([\w.[\]*]+)$/;
const RESPONSE_JSON = "response.json.";
const RESPONSE = "response.";

/**
 * Where to start completions and the prefix used to filter `paths` for structure completion.
 * JSONPath: path fragment at the line end. JS: after `response.json.` (JSON paths), or after
 * `response.` for top-level `response` members, else implicit `response.json.*` fragment.
 */
export function getStructureCompletionRange(
  mode: StructureCompletionMode,
  lineToCursor: string,
): { fromOffset: number; typedPrefix: string } | null {
  if (mode === "jsonpath") {
    const m = PATH_TOKEN.exec(lineToCursor);
    if (!m || m[1] === undefined) return null;
    return {
      fromOffset: lineToCursor.length - m[1].length,
      typedPrefix: m[1],
    };
  }

  const lower = lineToCursor.toLowerCase();
  const iJson = lower.lastIndexOf(RESPONSE_JSON);
  if (iJson >= 0) {
    const start = iJson + RESPONSE_JSON.length;
    return { fromOffset: start, typedPrefix: lineToCursor.slice(start) };
  }

  const iRes = lower.lastIndexOf(RESPONSE);
  if (iRes >= 0) {
    const after = lineToCursor.slice(iRes + RESPONSE.length);
    if (!after.toLowerCase().startsWith("json.")) {
      return {
        fromOffset: iRes + RESPONSE.length,
        typedPrefix: after,
      };
    }
  }

  const m = PATH_TOKEN.exec(lineToCursor);
  if (!m || m[1] === undefined) return null;
  return {
    fromOffset: lineToCursor.length - m[1].length,
    typedPrefix: m[1],
  };
}
