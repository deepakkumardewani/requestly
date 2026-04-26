import { NextResponse } from "next/server";
import {
  InputData,
  jsonInputForTargetLanguage,
  quicktype,
} from "quicktype-core";
import type { LanguageName } from "quicktype-core/dist/language/types";

const MAX_BODY_BYTES = 200 * 1024;

export async function POST(request: Request) {
  const { body, language } = await request.json();

  if (typeof body !== "string" || typeof language !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Response too large for schema generation (> 200 KB)" },
      { status: 422 },
    );
  }

  const trimmed = body.trim();

  if (!trimmed) {
    return NextResponse.json(
      { error: "Response body is empty" },
      { status: 422 },
    );
  }

  try {
    JSON.parse(trimmed);
  } catch {
    return NextResponse.json(
      { error: "Response is not valid JSON" },
      { status: 422 },
    );
  }

  try {
    const jsonInput = jsonInputForTargetLanguage(language as LanguageName);
    await jsonInput.addSource({ name: "Root", samples: [trimmed] });

    const inputData = new InputData();
    inputData.addInput(jsonInput);

    const result = await quicktype({
      inputData,
      lang: language as LanguageName,
      rendererOptions: { "just-types": "true" },
    });

    return NextResponse.json({ code: result.lines.join("\n") });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
