import { z } from "zod";

/** Max successful share creates per `userId` per rolling window (21st in same hour → 429). */
export const SHARE_RATE_LIMIT_MAX = 20;
export const SHARE_RATE_LIMIT_TTL_SEC = 3600;

export const SharePostBodySchema = z.object({
  ciphertext: z.string().min(1),
  iv: z.string().min(1),
  userId: z.string().min(1),
});

export type SharePostBody = z.infer<typeof SharePostBodySchema>;

/** What we persist under `share:{id}` (ciphertext only, no key). */
export const ShareStoredRecordSchema = z.object({
  ciphertext: z.string().min(1),
  iv: z.string().min(1),
});

export type ShareStoredRecord = z.infer<typeof ShareStoredRecordSchema>;

/**
 * Restores a stored share record from Redis. Accepts a JSON string (what we
 * set) or a plain object if the client returns a decoded value.
 * Parameter is `unknown` because the Redis client types GET as such.
 */
export function parseStoredShareRecord(raw: unknown): ShareStoredRecord | null {
  if (raw == null) return null;

  if (typeof raw === "string") {
    let parsed: ReturnType<typeof JSON.parse>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    const r = ShareStoredRecordSchema.safeParse(parsed);
    return r.success ? r.data : null;
  }

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const r = ShareStoredRecordSchema.safeParse(raw);
    return r.success ? r.data : null;
  }

  return null;
}

export function shareStorageKey(shareId: string): string {
  return `share:${shareId}`;
}

export function rateLimitKeyForUser(userId: string): string {
  return `ratelimit:${userId}`;
}

type RedisIncrTtl = {
  incr: (key: string) => Promise<number>;
  expire: (key: string, sec: number) => Promise<0 | 1 | boolean>;
};

/**
 * Increments the per-user counter and sets TTL on first use.
 * @returns "rate_limited" when this request is over the hourly cap (caller must not store).
 */
export async function enforceShareRateLimit(
  client: RedisIncrTtl,
  userId: string,
): Promise<"ok" | "rate_limited"> {
  const key = rateLimitKeyForUser(userId);
  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, SHARE_RATE_LIMIT_TTL_SEC);
  }
  if (count > SHARE_RATE_LIMIT_MAX) {
    return "rate_limited";
  }
  return "ok";
}
