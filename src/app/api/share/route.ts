import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import {
  enforceShareRateLimit,
  SharePostBodySchema,
  shareStorageKey,
} from "@/lib/shareServer";

export async function POST(req: Request): Promise<NextResponse> {
  let body: object;
  try {
    const parsed = await req.json();
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return NextResponse.json(
        { error: "Invalid body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }
    body = parsed;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const result = SharePostBodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid body", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const { ciphertext, iv, userId } = result.data;
  const rate = await enforceShareRateLimit(redis, userId);
  if (rate === "rate_limited") {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMIT" },
      { status: 429 },
    );
  }

  const id = nanoid(8);
  await redis.set(shareStorageKey(id), JSON.stringify({ ciphertext, iv }));
  return NextResponse.json({ id });
}
