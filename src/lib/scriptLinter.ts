export type LintResult =
  | { ok: true }
  | { ok: false; message: string; line?: number; column?: number };

/**
 * Runs a lightweight client-side syntax check by attempting to compile the
 * script with `new Function()`. Extracts line/column info from the thrown
 * SyntaxError when available.
 */
export function checkSyntax(code: string): LintResult {
  if (!code.trim()) return { ok: true };

  try {
    // eslint-disable-next-line no-new-func
    new Function(code);
    return { ok: true };
  } catch (err) {
    if (!(err instanceof SyntaxError)) {
      return { ok: false, message: String(err) };
    }

    const raw = err.message;
    // V8 appends " (<anonymous>:LINE:COL)" to the message
    const match = raw.match(/\(.*?:(\d+):(\d+)\)/);
    if (match) {
      // new Function wraps code in a function body, so line 1 is the function
      // prologue — subtract 1 to get the user's line number.
      const line = Math.max(1, Number(match[1]) - 1);
      const column = Number(match[2]);
      const baseMsg = raw.replace(/\s*\(.*?:\d+:\d+\)/, "").trim();
      return { ok: false, message: baseMsg, line, column };
    }

    return { ok: false, message: raw };
  }
}
