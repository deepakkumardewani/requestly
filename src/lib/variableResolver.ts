export type ResolvedToken = {
  text: string;
  isVariable: boolean;
  resolved: boolean;
};

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

/**
 * Resolves {{VAR}} tokens in a string using the provided env map.
 * Returns the resolved string.
 */
export function resolveVariables(
  template: string,
  env: Record<string, string>,
): string {
  return template.replace(VARIABLE_REGEX, (match, key) => env[key] ?? match);
}

/**
 * Tokenizes a string into literal and variable segments for inline highlighting.
 */
export function tokenizeVariables(
  template: string,
  env: Record<string, string>,
): ResolvedToken[] {
  const tokens: ResolvedToken[] = [];
  let lastIndex = 0;

  for (const match of template.matchAll(VARIABLE_REGEX)) {
    const [fullMatch, key] = match;
    const start = match.index ?? 0;

    if (start > lastIndex) {
      tokens.push({
        text: template.slice(lastIndex, start),
        isVariable: false,
        resolved: false,
      });
    }

    tokens.push({
      text: fullMatch,
      isVariable: true,
      resolved: key in env,
    });

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < template.length) {
    tokens.push({
      text: template.slice(lastIndex),
      isVariable: false,
      resolved: false,
    });
  }

  return tokens;
}
