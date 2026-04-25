import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("redis", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("exports a Redis singleton bound to Upstash env vars", async () => {
    const { redis } = await import("./redis");
    expect(redis).toBeDefined();
    // Constructor name may minify; presence of a typical command is enough
    expect(typeof redis.get).toBe("function");
  });
});
