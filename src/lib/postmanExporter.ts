import type {
  AuthConfig,
  BodyConfig,
  CollectionModel,
  KVPair,
  RequestModel,
} from "@/types";

// Postman Collection v2.1 types (subset required for export)
type PostmanHeader = { key: string; value: string; disabled?: boolean };
type PostmanUrlQuery = { key: string; value: string; disabled?: boolean };

type PostmanUrl = {
  raw: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: PostmanUrlQuery[];
};

type PostmanBody =
  | { mode: "raw"; raw: string; options?: { raw: { language: string } } }
  | { mode: "urlencoded"; urlencoded: PostmanHeader[] }
  | {
      mode: "formdata";
      formdata: Array<{ key: string; value: string; type: string }>;
    }
  | { mode: "none" };

type PostmanAuth =
  | { type: "noauth" }
  | {
      type: "bearer";
      bearer: Array<{ key: string; value: string; type: string }>;
    }
  | {
      type: "basic";
      basic: Array<{ key: string; value: string; type: string }>;
    }
  | {
      type: "apikey";
      apikey: Array<{ key: string; value: string; type: string }>;
    };

type PostmanItem = {
  name: string;
  request: {
    method: string;
    header: PostmanHeader[];
    url: PostmanUrl;
    body?: PostmanBody;
    auth?: PostmanAuth;
  };
};

type PostmanCollection = {
  info: {
    name: string;
    schema: string;
    description?: string;
  };
  item: PostmanItem[];
};

const POSTMAN_SCHEMA =
  "https://schema.getpostman.com/json/collection/v2.1.0/collection.json";

function buildPostmanUrl(rawUrl: string, params: KVPair[]): PostmanUrl {
  const enabledParams = params.filter((p) => p.enabled && p.key);

  let urlObj: URL | null = null;
  try {
    urlObj = new URL(rawUrl);
  } catch {
    // not a valid URL — keep raw
  }

  if (!urlObj) {
    return {
      raw: rawUrl,
      query: enabledParams.map((p) => ({ key: p.key, value: p.value })),
    };
  }

  const host = urlObj.hostname.split(".");
  const path = urlObj.pathname.split("/").filter(Boolean);
  const query: PostmanUrlQuery[] = [];

  urlObj.searchParams.forEach((value, key) => {
    query.push({ key, value });
  });
  for (const p of enabledParams) {
    if (p.enabled && p.key) {
      query.push({ key: p.key, value: p.value });
    }
  }

  return {
    raw: rawUrl,
    protocol: urlObj.protocol.replace(":", ""),
    host,
    path,
    ...(query.length > 0 ? { query } : {}),
  };
}

function buildPostmanBody(body: BodyConfig): PostmanBody | undefined {
  switch (body.type) {
    case "none":
      return undefined;
    case "json":
      return {
        mode: "raw",
        raw: body.content,
        options: { raw: { language: "json" } },
      };
    case "xml":
      return {
        mode: "raw",
        raw: body.content,
        options: { raw: { language: "xml" } },
      };
    case "text":
    case "html":
      return {
        mode: "raw",
        raw: body.content,
        options: { raw: { language: body.type } },
      };
    case "urlencoded": {
      const pairs = (body.formData ?? []).filter((p) => p.enabled && p.key);
      return {
        mode: "urlencoded",
        urlencoded: pairs.map((p) => ({ key: p.key, value: p.value })),
      };
    }
    case "form-data": {
      const pairs = (body.formData ?? []).filter((p) => p.enabled && p.key);
      return {
        mode: "formdata",
        formdata: pairs.map((p) => ({
          key: p.key,
          value: p.value,
          type: "text",
        })),
      };
    }
    default: {
      const _exhaustive: never = body.type;
      throw new Error(`Unsupported body type: ${_exhaustive}`);
    }
  }
}

function buildPostmanAuth(auth: AuthConfig): PostmanAuth | undefined {
  switch (auth.type) {
    case "none":
      return undefined;
    case "bearer":
      return {
        type: "bearer",
        bearer: [{ key: "token", value: auth.token, type: "string" }],
      };
    case "basic":
      return {
        type: "basic",
        basic: [
          { key: "username", value: auth.username, type: "string" },
          { key: "password", value: auth.password, type: "string" },
        ],
      };
    case "api-key":
      return {
        type: "apikey",
        apikey: [
          { key: "key", value: auth.key, type: "string" },
          { key: "value", value: auth.value, type: "string" },
          { key: "in", value: auth.addTo, type: "string" },
        ],
      };
    default: {
      const _exhaustive: never = auth;
      throw new Error(
        `Unsupported auth type: ${(_exhaustive as AuthConfig).type}`,
      );
    }
  }
}

function requestToPostmanItem(req: RequestModel): PostmanItem {
  const enabledHeaders = req.headers.filter((h) => h.enabled && h.key);
  const body = buildPostmanBody(req.body);
  const auth = buildPostmanAuth(req.auth);

  return {
    name: req.name,
    request: {
      method: req.method,
      header: enabledHeaders.map((h) => ({ key: h.key, value: h.value })),
      url: buildPostmanUrl(req.url, req.params),
      ...(body ? { body } : {}),
      ...(auth ? { auth } : {}),
    },
  };
}

export function exportToPostmanCollection(
  collection: CollectionModel,
  requests: RequestModel[],
): PostmanCollection {
  return {
    info: {
      name: collection.name,
      schema: POSTMAN_SCHEMA,
      ...(collection.description
        ? { description: collection.description }
        : {}),
    },
    item: requests.map(requestToPostmanItem),
  };
}

export function downloadPostmanCollection(
  collection: CollectionModel,
  requests: RequestModel[],
): void {
  const data = exportToPostmanCollection(collection, requests);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = collection.name.replace(/[^a-z0-9_-]/gi, "_");
  link.href = url;
  link.download = `${safeName}.postman_collection.json`;
  link.click();
  URL.revokeObjectURL(url);
}
