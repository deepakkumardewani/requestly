import { generateId } from "@/lib/utils";
import type { KVPair } from "@/types";

/** Parse stored body content into KV rows for form-data / urlencoded editors. */
export function parseFormDataFromContent(content: string): KVPair[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.entries(parsed as Record<string, unknown>).map(
          ([key, value]) => ({
            id: generateId(),
            key,
            value: value == null ? "" : String(value),
            enabled: true,
          }),
        );
      }
    } catch {
      // fall through to urlencoded string parsing
    }
  }

  return trimmed
    .split("&")
    .filter(Boolean)
    .map((part) => {
      const eqIdx = part.indexOf("=");
      const rawKey = eqIdx === -1 ? part : part.slice(0, eqIdx);
      const rawValue = eqIdx === -1 ? "" : part.slice(eqIdx + 1);
      try {
        return {
          id: generateId(),
          key: decodeURIComponent(rawKey.replace(/\+/g, " ")),
          value: decodeURIComponent(rawValue.replace(/\+/g, " ")),
          enabled: true,
        };
      } catch {
        return {
          id: generateId(),
          key: rawKey,
          value: rawValue,
          enabled: true,
        };
      }
    });
}

export function resolveFormDataRows(
  formData: KVPair[] | undefined,
  content: string,
): KVPair[] {
  if (formData && formData.length > 0) return formData;
  return parseFormDataFromContent(content);
}
