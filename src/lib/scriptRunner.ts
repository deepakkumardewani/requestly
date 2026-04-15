import { generateId } from "@/lib/utils";
import type { BodyConfig, HttpMethod, KVPair } from "@/types";

export type ScriptRequestContext = {
  url: string;
  headers: KVPair[];
  method: HttpMethod;
  body: BodyConfig;
};

export type ScriptResponseContext = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
};

export type ScriptResult = {
  logs: string[];
  error?: string;
  requestOverrides?: {
    url?: string;
    headers?: KVPair[];
    body?: BodyConfig;
  };
};

function formatArg(arg: unknown): string {
  if (typeof arg === "string") return arg;
  if (arg === null) return "null";
  if (arg === undefined) return "undefined";
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function makeConsoleInterceptor(logs: string[]) {
  const capture =
    (level: string) =>
    (...args: unknown[]) => {
      const message = args.map(formatArg).join(" ");
      logs.push(level === "log" ? message : `[${level}] ${message}`);
    };
  return {
    log: capture("log"),
    warn: capture("warn"),
    error: capture("error"),
    info: capture("info"),
  };
}

function makeEnvAPI(
  envGet: (key: string) => string | undefined,
  envSet: (key: string, value: string) => void,
) {
  return {
    get: (key: string) => envGet(key) ?? "",
    set: (key: string, value: string) => envSet(key, value),
  };
}

function makeRequestAPI(ctx: ScriptRequestContext) {
  let url = ctx.url;
  // Deep copy so mutations don't affect the original resolved request
  const headers: KVPair[] = ctx.headers.map((h) => ({ ...h }));
  const body: BodyConfig = { ...ctx.body };

  return {
    _getUrl: () => url,
    _getHeaders: () => headers,
    _getBody: () => body,
    request: {
      url: {
        get: () => url,
        set: (newUrl: string) => {
          url = newUrl;
        },
      },
      headers: {
        get: (key: string) =>
          headers.find(
            (h) => h.key.toLowerCase() === key.toLowerCase() && h.enabled,
          )?.value,
        set: (key: string, value: string) => {
          const existing = headers.find(
            (h) => h.key.toLowerCase() === key.toLowerCase(),
          );
          if (existing) {
            existing.value = value;
            existing.enabled = true;
          } else {
            headers.push({ id: generateId(), key, value, enabled: true });
          }
        },
        delete: (key: string) => {
          const idx = headers.findIndex(
            (h) => h.key.toLowerCase() === key.toLowerCase(),
          );
          if (idx !== -1) headers.splice(idx, 1);
        },
      },
      body: {
        get: () => body.content,
        set: (content: string) => {
          body.content = content;
        },
      },
    },
  };
}

function makeResponseAPI(ctx: ScriptResponseContext) {
  return {
    status: ctx.status,
    statusText: ctx.statusText,
    text: () => ctx.body,
    json: () => JSON.parse(ctx.body) as unknown,
    headers: {
      // Response headers may be lowercase-normalised by the proxy
      get: (key: string) =>
        ctx.headers[key] ?? ctx.headers[key.toLowerCase()] ?? undefined,
    },
  };
}

function execute(
  script: string,
  requestlyApi: Record<string, unknown>,
  logs: string[],
): string | undefined {
  if (!script.trim()) return undefined;
  try {
    const consoleProxy = makeConsoleInterceptor(logs);
    // new Function is intentional: single-user desktop app, no multi-tenancy
    // eslint-disable-next-line no-new-func
    const fn = new Function("requestly", "console", script);
    fn(requestlyApi, consoleProxy);
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
  return undefined;
}

export function runPreScript(
  script: string,
  request: ScriptRequestContext,
  envGet: (key: string) => string | undefined,
  envSet: (key: string, value: string) => void,
): ScriptResult {
  const logs: string[] = [];
  const reqApi = makeRequestAPI(request);
  const requestlyApi = {
    request: reqApi.request,
    environment: makeEnvAPI(envGet, envSet),
  };

  const error = execute(script, requestlyApi, logs);

  return {
    logs,
    error,
    requestOverrides: {
      url: reqApi._getUrl(),
      headers: reqApi._getHeaders(),
      body: reqApi._getBody(),
    },
  };
}

export function runPostScript(
  script: string,
  response: ScriptResponseContext,
  envGet: (key: string) => string | undefined,
  envSet: (key: string, value: string) => void,
): ScriptResult {
  const logs: string[] = [];
  const requestlyApi = {
    response: makeResponseAPI(response),
    environment: makeEnvAPI(envGet, envSet),
  };

  const error = execute(script, requestlyApi, logs);

  return { logs, error };
}
