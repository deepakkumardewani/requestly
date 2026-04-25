import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { parseStoredShareRecord, shareStorageKey } from "@/lib/shareServer";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _req: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  if (id == null || id === "") {
    return NextResponse.json(
      { error: "Not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const raw = await redis.get(shareStorageKey(id));
  const rec = parseStoredShareRecord(raw);
  if (rec == null) {
    return NextResponse.json(
      { error: "Not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ciphertext: rec.ciphertext, iv: rec.iv });
}
