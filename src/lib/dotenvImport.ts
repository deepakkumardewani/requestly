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
