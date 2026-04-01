import { JSONPath } from "jsonpath-plus";
import type { ResponseData } from "@/types";
import type { AssertionResult, ChainAssertion } from "@/types/chain";

/**
 * Extract the actual value for an assertion based on its source type.
 */
function extractActualValue(
  assertion: ChainAssertion,
  response: ResponseData,
): string | null {
  if (assertion.source === "status") {
    return String(response.status);
  }

  if (assertion.source === "jsonpath") {
    if (!assertion.sourcePath) return null;
    try {
      const parsed = JSON.parse(response.body);
      const result = JSONPath({ path: assertion.sourcePath, json: parsed });
      return Array.isArray(result) && result.length > 0
        ? String(result[0])
        : null;
    } catch {
      return null;
    }
  }

  if (assertion.source === "header") {
    if (!assertion.sourcePath) return null;
    const lowerKey = assertion.sourcePath.toLowerCase();
    const entry = Object.entries(response.headers).find(
      ([k]) => k.toLowerCase() === lowerKey,
    );
    return entry ? entry[1] : null;
  }

  return null;
}

/**
 * Evaluate a single assertion against a response.
 * Returns the pass/fail result and the actual value that was tested.
 */
export function evaluateAssertion(
  assertion: ChainAssertion,
  response: ResponseData,
): { passed: boolean; actual: string | null } {
  const actual = extractActualValue(assertion, response);
  const expected = assertion.expectedValue ?? "";

  let passed = false;

  switch (assertion.operator) {
    case "eq":
      passed = actual === expected;
      break;
    case "neq":
      passed = actual !== expected;
      break;
    case "contains":
      passed = actual?.includes(expected) ?? false;
      break;
    case "not_contains":
      passed = actual === null || !actual.includes(expected);
      break;
    case "gt": {
      const numActual = parseFloat(actual ?? "");
      const numExpected = parseFloat(expected);
      passed =
        !Number.isNaN(numActual) &&
        !Number.isNaN(numExpected) &&
        numActual > numExpected;
      break;
    }
    case "lt": {
      const numActual = parseFloat(actual ?? "");
      const numExpected = parseFloat(expected);
      passed =
        !Number.isNaN(numActual) &&
        !Number.isNaN(numExpected) &&
        numActual < numExpected;
      break;
    }
    case "exists":
      passed = actual !== null;
      break;
    case "not_exists":
      passed = actual === null;
      break;
    case "matches_regex": {
      try {
        passed = actual !== null && new RegExp(expected).test(actual);
      } catch {
        // Invalid regex — treat as failure
        passed = false;
      }
      break;
    }
  }

  return { passed, actual };
}

/**
 * Evaluate all enabled assertions against a response.
 */
export function evaluateAllAssertions(
  assertions: ChainAssertion[],
  response: ResponseData,
): AssertionResult[] {
  return assertions
    .filter((a) => a.enabled)
    .map((a) => {
      try {
        const { passed, actual } = evaluateAssertion(a, response);
        return { assertionId: a.id, passed, actual };
      } catch (err) {
        // Unexpected evaluation error — count as failure
        console.error("Assertion evaluation error", { assertionId: a.id, err });
        return { assertionId: a.id, passed: false, actual: null };
      }
    });
}

/**
 * Summarise assertion results into pass/fail/total counts.
 */
export function assertionsSummary(results: AssertionResult[]): {
  passed: number;
  failed: number;
  total: number;
} {
  const passed = results.filter((r) => r.passed).length;
  return { passed, failed: results.length - passed, total: results.length };
}
