import { parseTimingHeaders } from "@/lib/timingParser";
import type {
  AuthConfig,
  KVPair,
  RequestError,
  ResponseData,
  TabState,
} from "@/types";

type ResolvedRequest = {
  method: TabState["method"];
  url: string;
  headers: KVPair[];
  body: TabState["body"];
  auth: AuthConfig;
  sslVerify?: boolean;
  followRedirects?: boolean;
};

type ProxyResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  error?: string;
  code?: string;
};

function buildHeaders(request: ResolvedRequest): Record<string, string> {
  const headers: Record<string, string> = {};

  for (const h of request.headers) {
    if (h.enabled && h.key) {
      headers[h.key] = h.value;
    }
  }

  // Auth headers
  if (request.auth.type === "bearer") {
    headers.Authorization = `Bearer ${request.auth.token}`;
  } else if (request.auth.type === "basic") {
    const encoded = btoa(`${request.auth.username}:${request.auth.password}`);
    headers.Authorization = `Basic ${encoded}`;
  } else if (
    request.auth.type === "api-key" &&
    request.auth.addTo === "header"
  ) {
    headers[request.auth.key] = request.auth.value;
  }

  // Content-Type defaults for body
  if (request.body.type === "json" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  } else if (request.body.type === "xml" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/xml";
  } else if (request.body.type === "urlencoded" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  return headers;
}

function buildBody(request: ResolvedRequest): string | null {
  const { body } = request;

  if (body.type === "none") return null;

  if (["json", "xml", "text", "html"].includes(body.type)) {
    return body.content || null;
  }

  if (body.type === "urlencoded" && body.formData) {
    const enabled = body.formData.filter((f) => f.enabled && f.key);
    if (enabled.length === 0) return null;
    return enabled
      .map((f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`)
      .join("&");
  }

  // form-data — not supported via proxy text body (would need multipart)
  return body.content || null;
}

export async function runRequest(
  request: ResolvedRequest,
  signal?: AbortSignal,
): Promise<ResponseData> {
  const start = performance.now();

  const headers = buildHeaders(request);
  const body = buildBody(request);

  let url = request.url;
  // Append api-key to query if configured
  if (request.auth.type === "api-key" && request.auth.addTo === "query") {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}${encodeURIComponent(request.auth.key)}=${encodeURIComponent(request.auth.value)}`;
  }

  const proxyPayload = {
    url,
    method: request.method,
    headers,
    body: body ?? undefined,
    sslVerify: request.sslVerify ?? true,
    followRedirects: request.followRedirects ?? true,
  };

  let proxyResponse: Response;
  try {
    proxyResponse = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proxyPayload),
      signal,
    });
  } catch (cause) {
    const error: RequestError = {
      type: "network",
      message: "Failed to reach the proxy server",
      cause: cause instanceof Error ? cause.message : String(cause),
    };
    throw error;
  }

  let data: ProxyResponse;
  try {
    data = (await proxyResponse.json()) as ProxyResponse;
  } catch (cause) {
    const error: RequestError = {
      type: "parse",
      message: "Failed to parse proxy response",
      cause: cause instanceof Error ? cause.message : String(cause),
    };
    throw error;
  }

  if (!proxyResponse.ok || data.error) {
    const error: RequestError = {
      type: "proxy",
      message: data.error ?? `Proxy returned ${proxyResponse.status}`,
      cause: data.code,
    };
    throw error;
  }

  const duration = performance.now() - start;
  const size = new TextEncoder().encode(data.body).length;

  // Collect proxy response headers to extract server-side timing
  const proxyHeaders: Record<string, string> = {};
  proxyResponse.headers.forEach((value, key) => {
    proxyHeaders[key] = value;
  });
  const timing = parseTimingHeaders(proxyHeaders, duration);

  return {
    status: data.status,
    statusText: data.statusText,
    headers: data.headers,
    body: data.body,
    duration,
    size,
    url: request.url,
    method: request.method,
    timestamp: Date.now(),
    timing,
  };
}
