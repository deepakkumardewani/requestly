import { Redis } from "@upstash/redis";

/**
 * Singleton Upstash REST client. Reads `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` (see `.env.local.example`). Use from server-side
 * code (e.g. Route Handlers) only.
 */
export const redis: Redis = Redis.fromEnv();
