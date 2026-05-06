/**
 * Parse `.env`-style lines into key/value pairs. Later duplicate keys overwrite earlier ones.
 * Blank lines and lines starting with `#` are skipped.
 */
export function parseDotEnvContent(
  text: string,
): Array<{ key: string; value: string }> {
  const map = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key) continue;
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return [...map.entries()].map(([key, value]) => ({ key, value }));
}

/**
 * If clipboard text looks like a multi-line `.env` blob, returns parsed pairs; otherwise `null`
 * (single-line `KEY=value` pastes stay normal so one cell can still receive a single assignment).
 */
export function consumeDotEnvBulkPaste(
  text: string,
): Array<{ key: string; value: string }> | null {
  if (!/\r|\n/.test(text)) return null;
  const pairs = parseDotEnvContent(text);
  if (pairs.length === 0) return null;
  return pairs;
}
