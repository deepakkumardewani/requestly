import { NextResponse } from "next/server";
import { MAX_PROXY_RESPONSE_BYTES } from "@/lib/constants";

type ProxyRequest = {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  followRedirects?: boolean;
};

export async function POST(req: Request): Promise<NextResponse> {
  let payload: ProxyRequest;

  try {
    payload = (await req.json()) as ProxyRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body", code: "INVALID_PAYLOAD" },
      { status: 400 },
    );
  }

  const { url, method, headers = {}, body, followRedirects = true } = payload;

  if (!url) {
    return NextResponse.json(
      { error: "Missing required field: url", code: "MISSING_URL" },
      { status: 400 },
    );
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: `Invalid URL: "${url}"`, code: "INVALID_URL" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(url, {
      method: method.toUpperCase(),
      headers,
      body: body ?? undefined,
      // Next.js fetch supports redirect option
      redirect: followRedirects ? "follow" : "manual",
    });

    // Guard against huge responses
    const contentLength = upstream.headers.get("content-length");
    if (
      contentLength &&
      Number.parseInt(contentLength, 10) > MAX_PROXY_RESPONSE_BYTES
    ) {
      return NextResponse.json(
        {
          error: `Response too large (${contentLength} bytes). Maximum is ${MAX_PROXY_RESPONSE_BYTES} bytes.`,
          code: "RESPONSE_TOO_LARGE",
        },
        { status: 413 },
      );
    }

    const responseBody = await upstream.text();

    // Double-check actual size after reading
    if (
      new TextEncoder().encode(responseBody).length > MAX_PROXY_RESPONSE_BYTES
    ) {
      return NextResponse.json(
        {
          error: "Response body exceeds 50MB limit",
          code: "RESPONSE_TOO_LARGE",
        },
        { status: 413 },
      );
    }

    // Collect response headers
    const responseHeaders: Record<string, string> = {};
    upstream.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
      body: responseBody,
    });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Unknown network error";

    return NextResponse.json(
      {
        error: `Failed to fetch upstream: ${message}`,
        code: "UPSTREAM_ERROR",
      },
      { status: 502 },
    );
  }
}
