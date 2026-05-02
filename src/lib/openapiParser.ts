import { load as loadYaml } from "js-yaml";
import { generateId } from "@/lib/utils";
import type {
  AuthConfig,
  BodyConfig,
  HttpMethod,
  HttpTab,
  KVPair,
} from "@/types";

export class OpenApiParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenApiParseError";
  }
}

type HttpTabDraft = Omit<HttpTab, "tabId" | "requestId" | "isDirty">;

const METHOD_ALIASES: Record<string, HttpMethod> = {
  get: "GET",
  post: "POST",
  put: "PUT",
  patch: "PATCH",
  delete: "DELETE",
  head: "HEAD",
  options: "OPTIONS",
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseDocument(raw: string): unknown {
  const t = raw.trim();
  if (!t) {
    throw new OpenApiParseError("Empty document");
  }
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      // fall through — may be JSON with leading BOM handled by yaml
    }
  }
  try {
    return loadYaml(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid YAML/JSON";
    throw new OpenApiParseError(msg);
  }
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!b) return p;
  return `${b}${p}`;
}

/**
 * OpenAPI 3 `{param}` → `{{param}}` for env-style placeholders.
 */
function pathToUrlTemplate(pathTemplate: string): string {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const trimmed = name.trim();
    return `{{${trimmed}}}`;
  });
}

function swagger2BaseUrl(doc: Record<string, unknown>): string {
  const schemes = doc.schemes as string[] | undefined;
  const scheme = schemes?.[0] ?? "https";
  const host = String(doc.host ?? "").trim();
  const basePath = String(doc.basePath ?? "").trim() || "/";
  if (!host) return "";
  return joinUrl(`${scheme}://${host}`, basePath === "/" ? "" : basePath);
}

function openApi3BaseUrl(doc: Record<string, unknown>): string {
  const servers = doc.servers as unknown;
  if (!Array.isArray(servers) || servers.length === 0) return "";
  const first = servers[0];
  if (!isRecord(first)) return "";
  return String(first.url ?? "").trim();
}

function jsonStringifyExample(example: unknown): string {
  if (example === undefined) return "";
  if (typeof example === "string") return example;
  try {
    return JSON.stringify(example, null, 2);
  } catch {
    return String(example);
  }
}

function schemaExample(schema: unknown): string {
  if (!isRecord(schema)) return "";
  if ("example" in schema && schema.example !== undefined) {
    return jsonStringifyExample(schema.example);
  }
  if ("default" in schema && schema.default !== undefined) {
    return jsonStringifyExample(schema.default);
  }
  return "";
}

function pickBodyFromRequestBody(requestBody: unknown): {
  body: BodyConfig;
  consumeJson: boolean;
} {
  if (!isRecord(requestBody)) {
    return { body: { type: "none", content: "" }, consumeJson: false };
  }
  const content = requestBody.content as Record<string, unknown> | undefined;
  if (!content || typeof content !== "object") {
    return { body: { type: "none", content: "" }, consumeJson: false };
  }

  const jsonMt = content["application/json"] ?? content["application/*+json"];
  if (isRecord(jsonMt)) {
    const ex =
      jsonMt.example ??
      (isRecord(jsonMt.examples) && jsonMt.examples
        ? Object.values(jsonMt.examples)[0]
        : undefined);
    if (isRecord(ex) && "value" in ex) {
      const text = jsonStringifyExample(ex.value);
      return {
        body: text
          ? { type: "json", content: text }
          : { type: "none", content: "" },
        consumeJson: true,
      };
    }
    const exampleVal = jsonMt.example;
    const fromEx = jsonStringifyExample(exampleVal);
    if (fromEx) {
      return { body: { type: "json", content: fromEx }, consumeJson: true };
    }
    const schema = jsonMt.schema;
    const fromSchema = schemaExample(schema);
    if (fromSchema) {
      return { body: { type: "json", content: fromSchema }, consumeJson: true };
    }
  }

  const xmlMt = content["application/xml"] ?? content["text/xml"];
  if (isRecord(xmlMt)) {
    const text = jsonStringifyExample(xmlMt.example);
    if (typeof xmlMt.example === "string") {
      return {
        body: { type: "xml", content: xmlMt.example },
        consumeJson: false,
      };
    }
    return {
      body: text
        ? { type: "xml", content: text }
        : { type: "none", content: "" },
      consumeJson: false,
    };
  }

  const textPlain = content["text/plain"];
  if (isRecord(textPlain)) {
    const ex = textPlain.example;
    const s = typeof ex === "string" ? ex : jsonStringifyExample(ex);
    return { body: { type: "text", content: s }, consumeJson: false };
  }

  return { body: { type: "none", content: "" }, consumeJson: false };
}

type ParamInfo = {
  name: string;
  in: string;
  required?: boolean;
  schema?: unknown;
  example?: unknown;
  type?: string;
};

function normalizeParameters(raw: unknown): ParamInfo[] {
  if (!Array.isArray(raw)) return [];
  const out: ParamInfo[] = [];
  for (const p of raw) {
    if (!isRecord(p)) continue;
    if (typeof p.$ref === "string") continue;
    const name = String(p.name ?? "");
    const loc = String(p.in ?? "");
    if (!name || !loc) continue;
    out.push({
      name,
      in: loc,
      required: !!p.required,
      schema: p.schema,
      example: p.example,
      type: typeof p.type === "string" ? p.type : undefined,
    });
  }
  return out;
}

function mergeParams(pathLevel: unknown, operationLevel: unknown): ParamInfo[] {
  const a = normalizeParameters(pathLevel);
  const b = normalizeParameters(operationLevel);
  const byName = new Map<string, ParamInfo>();
  for (const p of a) {
    byName.set(`${p.in}:${p.name}`, p);
  }
  for (const p of b) {
    byName.set(`${p.in}:${p.name}`, p);
  }
  return [...byName.values()];
}

function paramsToKVPairs(paramList: ParamInfo[]): {
  params: KVPair[];
  headers: KVPair[];
} {
  const params: KVPair[] = [];
  const headers: KVPair[] = [];

  for (const p of paramList) {
    if (p.in === "query") {
      let val = "";
      if (p.example !== undefined) {
        val = String(p.example);
      } else if (isRecord(p.schema) && p.schema.default !== undefined) {
        val = String(p.schema.default);
      }
      params.push({
        id: generateId(),
        key: p.name,
        value: val,
        enabled: true,
        type: "query",
      });
    } else if (p.in === "header") {
      let val = "";
      if (p.example !== undefined) {
        val = String(p.example);
      } else if (isRecord(p.schema) && p.schema.default !== undefined) {
        val = String(p.schema.default);
      }
      headers.push({
        id: generateId(),
        key: p.name,
        value: val,
        enabled: true,
      });
    }
  }

  return { params, headers };
}

function swagger2BodyFromParams(
  paramList: ParamInfo[],
  consumes: string[] | undefined,
): BodyConfig {
  const bodyParam = paramList.find((p) => p.in === "body");
  if (!bodyParam || !bodyParam.schema) {
    return { type: "none", content: "" };
  }

  const consumeJson = consumes?.some((c) => c.includes("json")) ?? true;
  const text = schemaExample(bodyParam.schema);
  if (!text) {
    return { type: "none", content: "" };
  }
  if (consumeJson) {
    return { type: "json", content: text };
  }
  return { type: "text", content: text };
}

const DEFAULT_AUTH: AuthConfig = { type: "none" };

function buildRequestFromOperation(options: {
  method: HttpMethod;
  pathTemplate: string;
  baseUrl: string;
  operation: Record<string, unknown>;
  paramsFromPathItem: unknown;
  swaggerConsumes?: string[];
}): HttpTabDraft {
  const {
    method,
    pathTemplate,
    baseUrl,
    operation,
    paramsFromPathItem,
    swaggerConsumes,
  } = options;

  const paramList = mergeParams(paramsFromPathItem, operation.parameters);
  const { params: queryParams, headers: opHeaders } =
    paramsToKVPairs(paramList);

  const urlPath = pathToUrlTemplate(pathTemplate);
  const url = joinUrl(baseUrl, urlPath);

  const summary = String(operation.summary ?? "");
  const operationId = String(operation.operationId ?? "");
  const name = summary || operationId || `${method} ${pathTemplate}`;

  let body: BodyConfig;

  if (swaggerConsumes !== undefined) {
    body = swagger2BodyFromParams(paramList, swaggerConsumes);
  } else {
    const picked = pickBodyFromRequestBody(operation.requestBody);
    body = picked.body;
  }

  return {
    type: "http",
    name,
    method,
    url,
    params: queryParams,
    headers: [...opHeaders],
    auth: DEFAULT_AUTH,
    body,
    preScript: "",
    postScript: "",
  };
}

/**
 * Parses OpenAPI 3.x or Swagger 2.x JSON/YAML into one collection worth of HTTP tab drafts.
 */
export function parseOpenApi(raw: string): {
  collectionName: string;
  requests: HttpTabDraft[];
} {
  const docUnknown = parseDocument(raw);
  if (!isRecord(docUnknown)) {
    throw new OpenApiParseError("Root document must be an object");
  }
  const doc = docUnknown;

  const isSwagger2 = doc.swagger === "2.0";
  const openapiVer = doc.openapi;
  const isOas3 = typeof openapiVer === "string" && openapiVer.startsWith("3");

  if (!isSwagger2 && !isOas3) {
    throw new OpenApiParseError(
      "Not a valid OpenAPI 3.x or Swagger 2.0 document",
    );
  }

  const info = isRecord(doc.info) ? doc.info : {};
  const collectionName = String(info.title ?? "Imported API");

  const baseUrl = isSwagger2 ? swagger2BaseUrl(doc) : openApi3BaseUrl(doc);

  const paths = doc.paths;
  if (!isRecord(paths)) {
    throw new OpenApiParseError("Missing or invalid `paths` object");
  }

  const drafts: HttpTabDraft[] = [];

  for (const [pathKey, pathItemUnknown] of Object.entries(paths)) {
    if (!isRecord(pathItemUnknown)) continue;

    for (const [methodKey, operationUnknown] of Object.entries(
      pathItemUnknown,
    )) {
      const methodUpper = METHOD_ALIASES[methodKey.toLowerCase()];
      if (!methodUpper) continue;
      if (!isRecord(operationUnknown)) continue;

      const consumes = pathItemUnknown.consumes as string[] | undefined;
      const draft = buildRequestFromOperation({
        method: methodUpper,
        pathTemplate: pathKey,
        baseUrl,
        operation: operationUnknown,
        paramsFromPathItem: pathItemUnknown.parameters,
        swaggerConsumes: isSwagger2 ? consumes : undefined,
      });
      drafts.push(draft);
    }
  }

  if (drafts.length === 0) {
    throw new OpenApiParseError("No operations found in specification");
  }

  return {
    collectionName,
    requests: drafts,
  };
}

export function isProbablyOpenApiDoc(data: unknown): boolean {
  if (!isRecord(data)) return false;
  if (data.swagger === "2.0") return true;
  const v = data.openapi;
  return typeof v === "string" && v.startsWith("3");
}
