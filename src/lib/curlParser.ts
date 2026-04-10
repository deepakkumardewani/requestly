import { HTTP_METHODS } from "@/lib/constants";
import { generateId } from "@/lib/utils";
import type {
  AuthConfig,
  BodyConfig,
  HttpMethod,
  KVPair,
  ParsedCurl,
} from "@/types";

export class CurlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CurlParseError";
  }
}

/** Joins continuation lines (backslash at end) into a single line */
function joinContinuations(raw: string): string {
  return raw
    .replace(/\\\s*\n\s*/g, " ")
    .replace(/\\\s*\r\n\s*/g, " ")
    .trim();
}

/** Simple tokenizer that respects quoted strings */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < input.length) {
    // skip whitespace
    while (i < input.length && /\s/.test(input[i])) i++;
    if (i >= input.length) break;

    const ch = input[i];

    if (ch === "'" || ch === '"') {
      const quote = ch;
      i++;
      let token = "";
      while (i < input.length && input[i] !== quote) {
        if (input[i] === "\\" && i + 1 < input.length) {
          i++;
          token += input[i];
        } else {
          token += input[i];
        }
        i++;
      }
      i++; // skip closing quote
      tokens.push(token);
    } else {
      let token = "";
      while (i < input.length && !/\s/.test(input[i])) {
        token += input[i];
        i++;
      }
      tokens.push(token);
    }
  }

  return tokens;
}

function parseHeader(headerStr: string): { key: string; value: string } {
  const colonIdx = headerStr.indexOf(":");
  if (colonIdx === -1) {
    throw new CurlParseError(`Invalid header format: "${headerStr}"`);
  }
  return {
    key: headerStr.slice(0, colonIdx).trim(),
    value: headerStr.slice(colonIdx + 1).trim(),
  };
}

function isHttpMethod(value: string): value is HttpMethod {
  return HTTP_METHODS.includes(value.toUpperCase() as HttpMethod);
}

// Flags that take no argument (boolean flags) — used to avoid consuming next token as their value
const BOOLEAN_FLAGS = new Set([
  "--location",
  "-L",
  "--silent",
  "-s",
  "--verbose",
  "-v",
  "--include",
  "-i",
  "--compressed",
  "--no-keepalive",
  "--insecure",
  "-k",
  "--fail",
  "-f",
]);

export function parseCurl(input: string): ParsedCurl {
  const joined = joinContinuations(input.trim());
  const tokens = tokenize(joined);

  if (tokens[0]?.toLowerCase() !== "curl") {
    throw new CurlParseError('Input must start with "curl"');
  }

  let method: HttpMethod | null = null;
  let url = "";
  const rawHeaders: Array<{ key: string; value: string }> = [];
  let bodyContent = "";
  let basicAuth: { username: string; password: string } | null = null;
  const urlencodedParts: string[] = [];

  let i = 1;
  while (i < tokens.length) {
    const flag = tokens[i];

    if (flag === "-X" || flag === "--request") {
      i++;
      const m = tokens[i]?.toUpperCase();
      if (!m || !isHttpMethod(m)) {
        throw new CurlParseError(`Unknown HTTP method: "${tokens[i]}"`);
      }
      method = m;
    } else if (flag === "-H" || flag === "--header") {
      i++;
      if (!tokens[i]) throw new CurlParseError("Missing header value after -H");
      rawHeaders.push(parseHeader(tokens[i]));
    } else if (
      flag === "-d" ||
      flag === "--data" ||
      flag === "--data-raw" ||
      flag === "--data-binary"
    ) {
      i++;
      bodyContent = tokens[i] ?? "";
    } else if (flag === "--data-urlencode") {
      i++;
      urlencodedParts.push(tokens[i] ?? "");
    } else if (flag === "-u" || flag === "--user") {
      i++;
      const parts = (tokens[i] ?? "").split(":");
      basicAuth = {
        username: parts[0] ?? "",
        password: parts[1] ?? "",
      };
    } else if (BOOLEAN_FLAGS.has(flag)) {
      // Boolean flags — consume no argument, just skip
    } else if (!flag.startsWith("-")) {
      // Bare URL (only set once — first bare token after "curl" is the URL)
      if (!url) url = flag;
    }
    // Skip unrecognized flags with arguments — they will have consumed their own value next iteration
    i++;
  }

  if (!url) {
    throw new CurlParseError("No URL found in cURL command");
  }

  const hasBody = Boolean(bodyContent) || urlencodedParts.length > 0;

  // Infer method from body
  if (!method) {
    method = hasBody ? "POST" : "GET";
  }

  const headers: KVPair[] = rawHeaders.map((h) => ({
    id: generateId(),
    key: h.key,
    value: h.value,
    enabled: true,
  }));

  // Determine body config
  let body: BodyConfig = { type: "none", content: "" };

  if (urlencodedParts.length > 0) {
    // --data-urlencode flags → urlencoded formData KV pairs
    const formData: KVPair[] = urlencodedParts.map((part) => {
      const eqIdx = part.indexOf("=");
      if (eqIdx === -1)
        return { id: generateId(), key: part, value: "", enabled: true };
      return {
        id: generateId(),
        key: part.slice(0, eqIdx),
        value: part.slice(eqIdx + 1),
        enabled: true,
      };
    });
    const content = formData
      .map((f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`)
      .join("&");
    body = { type: "urlencoded", content, formData };
  } else if (bodyContent) {
    const contentTypeHeader = rawHeaders.find(
      (h) => h.key.toLowerCase() === "content-type",
    );
    const contentType = contentTypeHeader?.value ?? "";

    if (contentType.includes("application/json") || isJsonString(bodyContent)) {
      body = { type: "json", content: bodyContent };
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      body = { type: "urlencoded", content: bodyContent };
    } else if (
      contentType.includes("text/xml") ||
      contentType.includes("application/xml")
    ) {
      body = { type: "xml", content: bodyContent };
    } else {
      body = { type: "text", content: bodyContent };
    }
  }

  // Determine auth config
  let auth: AuthConfig = { type: "none" };
  if (basicAuth) {
    auth = { type: "basic", ...basicAuth };
  } else {
    const authHeader = rawHeaders.find(
      (h) => h.key.toLowerCase() === "authorization",
    );
    if (authHeader?.value.startsWith("Bearer ")) {
      auth = { type: "bearer", token: authHeader.value.slice(7) };
    }
  }

  return { method, url, headers, body, auth };
}

function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
