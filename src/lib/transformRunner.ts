export type ResponseObject = {
  json: unknown;
  text: string;
  status: number;
  headers: Record<string, string>;
};

type RunResult = { output: string } | { error: string };

const JSONPATH_REQUIRES_JSON = "JSONPath requires a JSON response";
const EXECUTION_TIMED_OUT = "Execution timed out (2000ms)";
const TIMEOUT_MS = 2000;

export async function runJsonPath(
  code: string,
  responseBody: string,
): Promise<RunResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseBody);
  } catch {
    return { error: JSONPATH_REQUIRES_JSON };
  }

  let path = code.trim();
  if (path && !path.startsWith("$")) {
    path = path.startsWith("[") ? `$${path}` : `$.${path}`;
  } else if (!path) {
    path = "$";
  }

  try {
    const { JSONPath } = await import("jsonpath-plus");
    // Dry-run against an empty object to catch syntax errors before running on real data
    JSONPath({ path, json: {}, wrap: true });
    const result = JSONPath({ path, json: parsed as object, wrap: true });
    if (!Array.isArray(result) || result.length === 0) {
      return { output: "[]" };
    }
    return { output: JSON.stringify(result, null, 2) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function runJs(
  code: string,
  responseObj: ResponseObject,
): Promise<RunResult> {
  // NOTE: new Function runs synchronously — a true infinite loop will block the
  // thread and the timeout below will not interrupt it. A Web Worker is the
  // correct fix (tracked for v2). For now, the timeout handles async hangs and
  // throw-based errors.
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ error: EXECUTION_TIMED_OUT });
    }, TIMEOUT_MS);

    try {
      let jsCode = code.trim();

      // Auto-prefix logic to save user from typing `return response.json.`
      if (jsCode && !jsCode.includes("return") && !jsCode.includes(";")) {
        if (jsCode.startsWith("[")) {
          jsCode = `return response.json${jsCode};`;
        } else if (jsCode.startsWith("response.")) {
          jsCode = `return ${jsCode};`;
        } else {
          jsCode = `return response.json.${jsCode};`;
        }
      } else if (!jsCode) {
        jsCode = `return response.json;`;
      }

      // eslint-disable-next-line no-new-func
      const fn = new Function("response", jsCode);
      const result = fn(responseObj);
      clearTimeout(timer);
      resolve({ output: JSON.stringify(result, null, 2) });
    } catch (err) {
      clearTimeout(timer);
      resolve({ error: err instanceof Error ? err.message : String(err) });
    }
  });
}
