import type { TabState } from "@/types";
import { buildFinalUrl } from "@/lib/utils";

/**
 * Generates a formatted multi-line curl command from a tab's state.
 */
export function generateCurl(tab: TabState, resolvedUrl?: string): string {
  const lines: string[] = [];
  const url = resolvedUrl ?? tab.url;

  // Substitute path params into URL path and append query params
  const finalUrl = buildFinalUrl(url, tab.params);

  lines.push(`curl -X ${tab.method} '${finalUrl}'`);

  // Add auth header if applicable
  if (tab.auth.type === "bearer") {
    lines.push(`  -H 'Authorization: Bearer ${tab.auth.token}'`);
  } else if (tab.auth.type === "basic") {
    const encoded = btoa(`${tab.auth.username}:${tab.auth.password}`);
    lines.push(`  -H 'Authorization: Basic ${encoded}'`);
  } else if (tab.auth.type === "api-key" && tab.auth.addTo === "header") {
    lines.push(`  -H '${tab.auth.key}: ${tab.auth.value}'`);
  }

  // Add headers
  const enabledHeaders = tab.headers.filter((h) => h.enabled && h.key);
  for (const header of enabledHeaders) {
    lines.push(`  -H '${header.key}: ${header.value}'`);
  }

  // Add body
  if (tab.body.type !== "none" && tab.body.content) {
    const escaped = tab.body.content.replace(/'/g, "'\\''");
    lines.push(`  -d '${escaped}'`);
  } else if (tab.body.type === "form-data" && tab.body.formData) {
    const enabledFields = tab.body.formData.filter((f) => f.enabled && f.key);
    for (const field of enabledFields) {
      lines.push(`  -F '${field.key}=${field.value}'`);
    }
  } else if (tab.body.type === "urlencoded" && tab.body.formData) {
    const enabledFields = tab.body.formData.filter((f) => f.enabled && f.key);
    if (enabledFields.length > 0) {
      const data = enabledFields
        .map(
          (f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`,
        )
        .join("&");
      lines.push(`  --data-urlencode '${data}'`);
    }
  }

  return lines.join(" \\\n");
}
