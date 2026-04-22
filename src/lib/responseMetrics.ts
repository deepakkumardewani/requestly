import type { BodyConfig, HttpTab, KVPair } from "@/types";

/** Approximate wire size of a header block (HTTP-style lines). */
export function estimateHeaderBlockBytes(
  headers: Record<string, string>,
): number {
  let n = 0;
  const enc = new TextEncoder();
  for (const [k, v] of Object.entries(headers)) {
    n += enc.encode(`${k}: ${v}\r\n`).length;
  }
  return n;
}

export function estimateKvHeadersBytes(headers: KVPair[]): number {
  let n = 0;
  const enc = new TextEncoder();
  for (const h of headers) {
    if (!h.enabled || !h.key) continue;
    n += enc.encode(`${h.key}: ${h.value}\r\n`).length;
  }
  return n;
}

export function estimateRequestBodyBytes(body: BodyConfig): number {
  if (body.type === "none") return 0;
  const enc = new TextEncoder();

  if (body.type === "urlencoded" && body.formData) {
    const params = new URLSearchParams();
    for (const p of body.formData) {
      if (p.enabled && p.key) params.append(p.key, p.value);
    }
    return enc.encode(params.toString()).length;
  }

  if (body.type === "form-data" && body.formData) {
    let n = 0;
    for (const p of body.formData) {
      if (!p.enabled || !p.key) continue;
      n += enc.encode(p.key).length + enc.encode(p.value).length + 128;
    }
    return n;
  }

  return enc.encode(body.content ?? "").length;
}

export function estimateHttpTabRequestBytes(tab: HttpTab): {
  headers: number;
  body: number;
} {
  let headers = estimateKvHeadersBytes(tab.headers);
  if (tab.auth.type === "bearer" && tab.auth.token) {
    headers += new TextEncoder().encode(
      `Authorization: Bearer ${tab.auth.token}\r\n`,
    ).length;
  } else if (tab.auth.type === "basic") {
    headers += new TextEncoder().encode(
      `Authorization: Basic ${tab.auth.username}:${tab.auth.password}\r\n`,
    ).length;
  } else if (tab.auth.type === "api-key" && tab.auth.addTo === "header") {
    headers += new TextEncoder().encode(
      `${tab.auth.key}: ${tab.auth.value}\r\n`,
    ).length;
  }
  return {
    headers,
    body: estimateRequestBodyBytes(tab.body),
  };
}
