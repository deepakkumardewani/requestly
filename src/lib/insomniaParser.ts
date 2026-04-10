import { generateId } from "@/lib/utils";
import type {
  AuthConfig,
  BodyConfig,
  HttpMethod,
  KVPair,
  TabState,
} from "@/types";

export class InsomniaParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsomniaParseError";
  }
}

type InsomniaResource = Record<string, unknown>;

type ParsedCollection = {
  name: string;
  requests: Omit<TabState, "tabId" | "requestId" | "isDirty">[];
};

function parseInsomniaHeaders(
  headers: Array<Record<string, unknown>>,
): KVPair[] {
  return headers
    .filter((h) => h.name && !h.disabled)
    .map((h) => ({
      id: generateId(),
      key: String(h.name ?? ""),
      value: String(h.value ?? ""),
      enabled: true,
    }));
}

function parseInsomniaBody(body: Record<string, unknown>): BodyConfig {
  const mimeType = String(body.mimeType ?? "");

  if (mimeType.includes("application/json")) {
    return { type: "json", content: String(body.text ?? "") };
  }
  if (mimeType.includes("application/x-www-form-urlencoded")) {
    const params =
      (body.params as Array<Record<string, unknown>> | undefined) ?? [];
    const encoded = params
      .filter((p) => !p.disabled)
      .map(
        (p) =>
          `${encodeURIComponent(String(p.name ?? ""))}=${encodeURIComponent(String(p.value ?? ""))}`,
      )
      .join("&");
    return { type: "urlencoded", content: encoded };
  }
  if (mimeType.includes("text/xml") || mimeType.includes("application/xml")) {
    return { type: "xml", content: String(body.text ?? "") };
  }
  if (body.text) {
    return { type: "text", content: String(body.text) };
  }

  return { type: "none", content: "" };
}

function parseInsomniaAuth(auth: Record<string, unknown>): AuthConfig {
  const type = String(auth.type ?? "none");

  if (type === "bearer") {
    return { type: "bearer", token: String(auth.token ?? "") };
  }
  if (type === "basic") {
    return {
      type: "basic",
      username: String(auth.username ?? ""),
      password: String(auth.password ?? ""),
    };
  }

  return { type: "none" };
}

/**
 * Parses an Insomnia v4 export JSON into grouped collections.
 * Groups requests by their parentId (workspace or request_group).
 */
export function parseInsomnia(
  data: Record<string, unknown>,
): ParsedCollection[] {
  if (data._type !== "export") {
    throw new InsomniaParseError(
      'Not a valid Insomnia export (missing _type: "export")',
    );
  }

  const resources = (data.resources as InsomniaResource[] | undefined) ?? [];

  // Build a map of group id → group name for folder grouping
  const groupNames = new Map<string, string>();
  const workspaceName = "Imported from Insomnia";

  for (const r of resources) {
    if (r._type === "request_group") {
      groupNames.set(String(r._id), String(r.name ?? "Folder"));
    }
    if (r._type === "workspace") {
      groupNames.set(String(r._id), String(r.name ?? workspaceName));
    }
  }

  // Group requests by parentId
  const requestsByGroup = new Map<string, typeof resources>();

  for (const r of resources) {
    if (r._type !== "request") continue;
    const parentId = String(r.parentId ?? "");
    if (!requestsByGroup.has(parentId)) {
      requestsByGroup.set(parentId, []);
    }

    requestsByGroup.get(parentId)?.push(r);
  }

  if (requestsByGroup.size === 0) {
    throw new InsomniaParseError("No requests found in Insomnia export");
  }

  const collections: ParsedCollection[] = [];

  for (const [groupId, reqs] of requestsByGroup) {
    const collectionName = groupNames.get(groupId) ?? workspaceName;

    const requests = reqs.map((r) => {
      const headers = parseInsomniaHeaders(
        (r.headers as Array<Record<string, unknown>> | undefined) ?? [],
      );
      const body = r.body
        ? parseInsomniaBody(r.body as Record<string, unknown>)
        : ({ type: "none", content: "" } as BodyConfig);
      const auth = r.authentication
        ? parseInsomniaAuth(r.authentication as Record<string, unknown>)
        : ({ type: "none" } as AuthConfig);

      const method = String(r.method ?? "GET").toUpperCase() as HttpMethod;

      return {
        name: String(r.name ?? "Request"),
        method,
        url: String(r.url ?? ""),
        params: [] as KVPair[],
        headers,
        auth,
        body,
        preScript: "",
        postScript: "",
      };
    });

    collections.push({ name: collectionName, requests });
  }

  return collections;
}

export function isInsomniaExport(data: Record<string, unknown>): boolean {
  return data._type === "export" && Array.isArray(data.resources);
}
