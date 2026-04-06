import type {
  ChainEdge,
  ChainRunState,
  ConditionNodeConfig,
  DelayNodeConfig,
} from "@/types/chain";

/**
 * Returns a promise that resolves after the configured delay.
 * Rejects immediately if the signal is already aborted, or when it fires during the wait.
 */
export function resolveDelay(
  node: DelayNodeConfig,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Aborted"));
      return;
    }

    const timer = setTimeout(resolve, node.delayMs);

    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new Error("Aborted"));
      },
      { once: true },
    );
  });
}

/**
 * Evaluate a condition node against the resolved variable values built from incoming edges.
 *
 * `varValues` is a map of variable name → extracted value, constructed by the caller
 * from incoming edges: the last segment of each edge's sourceJsonPath becomes the key.
 *
 * Returns the ID of the first matching branch, the else branch (empty expression) as
 * fallback, or null if no branches are configured.
 */
export function evaluateCondition(
  node: ConditionNodeConfig,
  varValues: Record<string, string>,
): string | null {
  if (node.branches.length === 0) return null;

  const varName = node.variable.replace(/^\{\{|\}\}$/g, "").trim();
  const value = varValues[varName] ?? "";

  let elseBranchId: string | undefined;

  for (const branch of node.branches) {
    if (!branch.expression.trim()) {
      // Reserve the else branch; only use if nothing else matches
      elseBranchId = branch.id;
      continue;
    }
    if (testExpression(value, branch.expression)) {
      return branch.id;
    }
  }

  return elseBranchId ?? null;
}

/**
 * Build a variable-name → value map from a set of edge-extracted values.
 * The variable name is derived from the last dot-segment of the edge's sourceJsonPath.
 * Edges with a branchId (routing edges from condition nodes) are excluded.
 */
export function buildVarValues(
  incomingEdges: ChainEdge[],
  extractedValues: Record<string, string | null>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const edge of incomingEdges) {
    if (edge.branchId) continue; // routing edges carry no extracted value
    for (const injection of edge.injections ?? []) {
      const valueKey = `${edge.id}:${injection.sourceJsonPath}`;
      const value = extractedValues[valueKey] ?? extractedValues[edge.id];
      if (value === null || value === undefined) continue;
      const rawPath = injection.sourceJsonPath;
      // Extract last segment: "$.data.role" → "role"; "$.items[0]" → "items[0]"
      const lastPart =
        rawPath
          .split(".")
          .at(-1)
          ?.replace(/['"[\]]/g, "")
          .trim() ?? edge.id;
      result[lastPart] = value;
    }
  }
  return result;
}

/**
 * Evaluate a simple expression string against a resolved value.
 * Supported forms: == 'str', != 'str', == num, > num, < num, contains 'str'
 */
function testExpression(value: string, expression: string): boolean {
  const expr = expression.trim();

  const eqStr = expr.match(/^==\s*['"](.*)['"]$/);
  if (eqStr) return value === eqStr[1];

  const neqStr = expr.match(/^!=\s*['"](.*)['"]$/);
  if (neqStr) return value !== neqStr[1];

  const eqNum = expr.match(/^==\s*(-?\d+(?:\.\d+)?)$/);
  if (eqNum) return Number(value) === Number(eqNum[1]);

  const neqNum = expr.match(/^!=\s*(-?\d+(?:\.\d+)?)$/);
  if (neqNum) return Number(value) !== Number(neqNum[1]);

  const gt = expr.match(/^>\s*(-?\d+(?:\.\d+)?)$/);
  if (gt) return Number(value) > Number(gt[1]);

  const lt = expr.match(/^<\s*(-?\d+(?:\.\d+)?)$/);
  if (lt) return Number(value) < Number(lt[1]);

  const contains = expr.match(/^contains\s+['"](.*)['"]$/);
  if (contains) return value.includes(contains[1]);

  return false;
}

// Re-exported so callers can import from one place
export type { ChainRunState };
