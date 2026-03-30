type BodyPattern = { keyword: string; hint: string };

type ErrorEntry = {
  title: string;
  cause: string;
  suggestions: string[];
  mdnUrl: string;
  bodyPatterns: BodyPattern[];
};

export type ErrorExplanation = ErrorEntry & {
  // Hints derived from scanning the actual response body at runtime
  matchedHints: string[];
};

const MDN_BASE = "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status";

const ERROR_MAP: Record<number, ErrorEntry> = {
  400: {
    title: "400 Bad Request",
    cause:
      "The server could not understand the request due to invalid syntax or a malformed request body.",
    suggestions: [
      "Check that your request body is valid JSON (if sending JSON)",
      "Verify all required fields are present and correctly named",
      "Ensure query parameters are properly URL-encoded",
      "Confirm the Content-Type header matches your request body format",
    ],
    mdnUrl: `${MDN_BASE}/400`,
    bodyPatterns: [
      {
        keyword: "invalid",
        hint: "The server flagged something as invalid — inspect each field in your request body",
      },
      {
        keyword: "missing",
        hint: "A required field is missing from the request",
      },
      {
        keyword: "required",
        hint: "One or more required fields were not provided",
      },
      {
        keyword: "syntax",
        hint: "The request body contains a syntax error — validate your JSON/XML",
      },
    ],
  },
  401: {
    title: "401 Unauthorized",
    cause:
      "The request lacks valid authentication credentials. The server requires you to authenticate before accessing this resource.",
    suggestions: [
      "Check that your API key or token is present in the request",
      "Verify the token is in the correct format (e.g. 'Bearer <token>')",
      "Ensure the token has not expired — try refreshing or regenerating it",
      "Confirm the Authorization header name and value are correct",
    ],
    mdnUrl: `${MDN_BASE}/401`,
    bodyPatterns: [
      {
        keyword: "expired",
        hint: "Your token appears to have expired — regenerate or refresh it",
      },
      {
        keyword: "invalid_token",
        hint: "The token format is incorrect — check the expected format in the API docs",
      },
      {
        keyword: "unauthorized",
        hint: "Your API key may be incorrect or revoked — verify it in your account dashboard",
      },
      {
        keyword: "token",
        hint: "There is an issue with your authentication token",
      },
    ],
  },
  403: {
    title: "403 Forbidden",
    cause:
      "The server understood the request but refuses to authorise it. You are authenticated but do not have permission to access this resource.",
    suggestions: [
      "Verify your API key or token has the required permission scope",
      "Check if your account plan allows access to this endpoint",
      "Confirm you are not blocked by an IP allowlist or firewall rule",
      "Review the API documentation for required roles or permissions",
    ],
    mdnUrl: `${MDN_BASE}/403`,
    bodyPatterns: [
      {
        keyword: "scope",
        hint: "Your API key may not have the required permission scope for this action",
      },
      {
        keyword: "permission",
        hint: "Your account lacks the necessary permissions for this resource",
      },
      {
        keyword: "forbidden",
        hint: "Access to this resource is explicitly denied for your credentials",
      },
      {
        keyword: "insufficient",
        hint: "Your credentials have insufficient privileges — check the required scope",
      },
    ],
  },
  404: {
    title: "404 Not Found",
    cause:
      "The server could not find the requested resource. The URL may be incorrect, or the resource may have been deleted or never existed.",
    suggestions: [
      "Double-check the URL path for typos or missing segments",
      "Verify the resource ID in the URL actually exists",
      "Confirm the API version in the URL matches the documentation",
      "Check if the resource requires a specific base URL or subdomain",
    ],
    mdnUrl: `${MDN_BASE}/404`,
    bodyPatterns: [
      {
        keyword: "not found",
        hint: "The specific resource was not found — verify the ID or path segment",
      },
      {
        keyword: "does not exist",
        hint: "The resource does not exist in the system",
      },
      {
        keyword: "no such",
        hint: "The identifier provided does not match any existing resource",
      },
    ],
  },
  405: {
    title: "405 Method Not Allowed",
    cause:
      "The HTTP method used in the request is not supported for this endpoint.",
    suggestions: [
      "Check the API documentation for the allowed HTTP methods on this endpoint",
      "Verify you are not using POST where GET is expected (or vice versa)",
      "Inspect the Allow response header to see which methods are permitted",
    ],
    mdnUrl: `${MDN_BASE}/405`,
    bodyPatterns: [
      {
        keyword: "not allowed",
        hint: "This HTTP method is explicitly not allowed on this endpoint",
      },
      {
        keyword: "method",
        hint: "The HTTP method you used is not supported here — check the docs",
      },
    ],
  },
  408: {
    title: "408 Request Timeout",
    cause:
      "The server timed out waiting for the request. The client did not send the complete request within the time the server was prepared to wait.",
    suggestions: [
      "Check your network connection stability",
      "Reduce the size of the request body if possible",
      "Increase the timeout setting in the proxy configuration",
      "Try the request again — timeouts can be transient",
    ],
    mdnUrl: `${MDN_BASE}/408`,
    bodyPatterns: [
      {
        keyword: "timeout",
        hint: "The connection timed out — the server may be overloaded or your network is slow",
      },
    ],
  },
  409: {
    title: "409 Conflict",
    cause:
      "The request conflicts with the current state of the server. Often occurs when trying to create a resource that already exists.",
    suggestions: [
      "Check if the resource you are trying to create already exists",
      "Use a PUT or PATCH request to update an existing resource instead",
      "Verify there are no duplicate unique field values in your request body",
      "Try fetching the current resource state before modifying it",
    ],
    mdnUrl: `${MDN_BASE}/409`,
    bodyPatterns: [
      {
        keyword: "already exists",
        hint: "A resource with this identifier already exists — use an update endpoint instead",
      },
      {
        keyword: "duplicate",
        hint: "A duplicate value was detected for a unique field",
      },
      {
        keyword: "conflict",
        hint: "The resource state has changed since your last read — re-fetch and retry",
      },
    ],
  },
  410: {
    title: "410 Gone",
    cause:
      "The resource has been permanently deleted from the server and will not be available again.",
    suggestions: [
      "The resource has been permanently removed — update any stored references",
      "Check if the API has a replacement endpoint or migrated to a new URL",
      "Remove any bookmarks or cached links pointing to this resource",
    ],
    mdnUrl: `${MDN_BASE}/410`,
    bodyPatterns: [
      {
        keyword: "deleted",
        hint: "The resource was permanently deleted from the server",
      },
      {
        keyword: "removed",
        hint: "This resource has been removed and is no longer available",
      },
    ],
  },
  422: {
    title: "422 Unprocessable Entity",
    cause:
      "The request was well-formed but the server was unable to process the contained instructions due to semantic errors.",
    suggestions: [
      "Check the response body for a list of validation errors",
      "Verify all field values match the expected types and formats",
      "Ensure date, email, and enum fields contain valid values",
      "Review the API documentation for field validation constraints",
    ],
    mdnUrl: `${MDN_BASE}/422`,
    bodyPatterns: [
      {
        keyword: "validation",
        hint: "Validation failed — inspect the errors array in the response body for field-level details",
      },
      {
        keyword: "invalid",
        hint: "One or more field values are invalid — check the expected formats in the docs",
      },
      {
        keyword: "errors",
        hint: "The response contains a list of validation errors — read them carefully",
      },
    ],
  },
  429: {
    title: "429 Too Many Requests",
    cause:
      "You have exceeded the API's rate limit. The server is refusing further requests until the rate limit window resets.",
    suggestions: [
      "Add delays between requests to stay within the rate limit",
      "Check the Retry-After response header for the reset time",
      "Implement exponential backoff in your client code",
      "Review the API's rate limit documentation and consider upgrading your plan",
    ],
    mdnUrl: `${MDN_BASE}/429`,
    bodyPatterns: [
      {
        keyword: "rate limit",
        hint: "You are exceeding the API's rate limit — add delays or reduce request frequency",
      },
      {
        keyword: "rate_limit",
        hint: "Rate limit exceeded — check the Retry-After header and wait before retrying",
      },
      {
        keyword: "too many",
        hint: "Too many requests sent in a short window — implement backoff logic",
      },
      {
        keyword: "throttl",
        hint: "Your requests are being throttled — slow down your request frequency",
      },
    ],
  },
  500: {
    title: "500 Internal Server Error",
    cause:
      "The server encountered an unexpected condition that prevented it from fulfilling the request. This is a server-side bug.",
    suggestions: [
      "Try the request again — 500 errors can be transient",
      "Check if the API has a status page for ongoing incidents",
      "Simplify your request body to isolate the cause",
      "Contact the API provider if the error persists",
    ],
    mdnUrl: `${MDN_BASE}/500`,
    bodyPatterns: [
      {
        keyword: "exception",
        hint: "An unhandled exception occurred on the server",
      },
      {
        keyword: "unexpected",
        hint: "The server encountered an unexpected error — this is a server-side bug",
      },
      {
        keyword: "error",
        hint: "The server returned a generic error — check any details in the response body",
      },
    ],
  },
  502: {
    title: "502 Bad Gateway",
    cause:
      "The server, while acting as a gateway or proxy, received an invalid response from an upstream server.",
    suggestions: [
      "Try the request again — 502 errors are usually transient",
      "Check if the upstream service or API is experiencing downtime",
      "Look for a status page for the service you are calling",
      "If behind a proxy, verify the proxy configuration is correct",
    ],
    mdnUrl: `${MDN_BASE}/502`,
    bodyPatterns: [
      {
        keyword: "gateway",
        hint: "An upstream gateway or proxy is returning an error",
      },
      {
        keyword: "upstream",
        hint: "The upstream service returned an invalid response",
      },
    ],
  },
  503: {
    title: "503 Service Unavailable",
    cause:
      "The server is not ready to handle the request. This is often caused by the server being overloaded or down for maintenance.",
    suggestions: [
      "Try the request again after a short delay",
      "Check the Retry-After header for when the service will be available",
      "Check the API provider's status page for maintenance windows",
      "Consider implementing retry logic with exponential backoff",
    ],
    mdnUrl: `${MDN_BASE}/503`,
    bodyPatterns: [
      {
        keyword: "maintenance",
        hint: "The server is under scheduled maintenance — check for a maintenance window",
      },
      {
        keyword: "unavailable",
        hint: "The service is temporarily unavailable — retry after a short delay",
      },
      {
        keyword: "overloaded",
        hint: "The server is overloaded — reduce request frequency and retry",
      },
    ],
  },
  504: {
    title: "504 Gateway Timeout",
    cause:
      "The server, while acting as a gateway or proxy, did not receive a timely response from an upstream server.",
    suggestions: [
      "Try the request again — gateway timeouts can be transient",
      "Check if the upstream service is slow or experiencing high load",
      "Consider breaking large requests into smaller chunks",
      "Verify the network path between you and the server is stable",
    ],
    mdnUrl: `${MDN_BASE}/504`,
    bodyPatterns: [
      {
        keyword: "timeout",
        hint: "The upstream server timed out — it may be under heavy load",
      },
      {
        keyword: "timed out",
        hint: "A downstream service timed out while processing your request",
      },
    ],
  },
};

export function explainError(
  status: number,
  body: string,
): ErrorExplanation | null {
  if (status < 400) return null;

  const base = ERROR_MAP[status];
  if (!base) return null;

  const lowerBody = body.toLowerCase();
  const matchedHints = base.bodyPatterns
    .filter(({ keyword }) => lowerBody.includes(keyword))
    .map(({ hint }) => hint);

  return {
    ...base,
    matchedHints,
  };
}
