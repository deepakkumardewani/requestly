import { z } from "zod";
import type { HttpTab } from "@/types";

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

const BODY_TYPES = [
  "none",
  "json",
  "xml",
  "text",
  "html",
  "form-data",
  "urlencoded",
] as const;

const KVPairSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
  type: z.enum(["query", "path"]).optional(),
});

const AuthConfigSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("bearer"), token: z.string() }),
  z.object({
    type: z.literal("basic"),
    username: z.string(),
    password: z.string(),
  }),
  z.object({
    type: z.literal("api-key"),
    key: z.string(),
    value: z.string(),
    addTo: z.enum(["header", "query"]),
  }),
]);

const BodyConfigSchema = z.object({
  type: z.enum(BODY_TYPES),
  content: z.string(),
  formData: z.array(KVPairSchema).optional(),
});

export const ShareRequestSchema = z.object({
  method: z.enum(HTTP_METHODS),
  url: z.string(),
  headers: z.array(KVPairSchema),
  params: z.array(KVPairSchema),
  body: BodyConfigSchema,
  auth: AuthConfigSchema,
});

export type SharePayload = z.infer<typeof ShareRequestSchema>;

// 8KB — share URLs beyond this become unusable in most browsers/Slack/etc.
const MAX_ENCODED_BYTES = 8 * 1024;

/**
 * Encodes a tab's request state into a shareable URL.
 * Returns null when the encoded payload exceeds MAX_ENCODED_BYTES.
 */
export function encodeShareLink(tab: HttpTab): string | null {
  const payload: SharePayload = {
    method: tab.method,
    url: tab.url,
    headers: tab.headers,
    params: tab.params,
    body: tab.body,
    auth: tab.auth,
  };

  try {
    // encodeURIComponent + btoa handles the full Unicode range correctly
    const json = JSON.stringify(payload);
    const encoded = btoa(unescape(encodeURIComponent(json)));

    if (encoded.length > MAX_ENCODED_BYTES) return null;

    return `${window.location.origin}/?r=${encoded}`;
  } catch {
    return null;
  }
}

/**
 * Decodes and validates a raw base64 share payload.
 * Returns null on any decode, parse, or schema-validation failure.
 */
export function decodeShareLink(raw: string): SharePayload | null {
  try {
    const decoded = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(decoded);
    return ShareRequestSchema.parse(parsed);
  } catch {
    return null;
  }
}
