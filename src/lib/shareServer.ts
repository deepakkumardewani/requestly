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
