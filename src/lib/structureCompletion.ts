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
