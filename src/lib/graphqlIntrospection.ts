import { DEFAULT_REQUEST_TIMEOUT_MS } from "@/lib/constants";
import type { KVPair, RequestError } from "@/types";

const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        ...FullType
      }
    }
  }

  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: false) {
      name
      description
      args {
        name
        type {
          ...TypeRef
        }
        defaultValue
      }
      type {
        ...TypeRef
      }
    }
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
        }
      }
    }
  }
`;

export type IntrospectionTypeRef = {
  kind: string;
  name: string | null;
  ofType: IntrospectionTypeRef | null;
};

export type IntrospectionArg = {
  name: string;
  type: IntrospectionTypeRef;
  defaultValue: string | null;
};

export type IntrospectionField = {
  name: string;
  description: string | null;
  args: IntrospectionArg[];
  type: IntrospectionTypeRef;
};

export type IntrospectionFullType = {
  kind: string;
  name: string;
  description: string | null;
  fields: IntrospectionField[] | null;
};

export type ParsedSchema = {
  queryTypeName: string | null;
  mutationTypeName: string | null;
  subscriptionTypeName: string | null;
  types: IntrospectionFullType[];
};

/** Recursively formats a type ref into a human-readable string like `String!` or `[User!]!` */
export function formatTypeRef(ref: IntrospectionTypeRef | null): string {
  if (!ref) return "Unknown";
  if (ref.kind === "NON_NULL") return `${formatTypeRef(ref.ofType)}!`;
  if (ref.kind === "LIST") return `[${formatTypeRef(ref.ofType)}]`;
  return ref.name ?? "Unknown";
}

type FetchSchemaOptions = {
  url: string;
  headers: KVPair[];
  sslVerify: boolean;
  followRedirects: boolean;
  timeoutMs: number;
  signal?: AbortSignal;
};

/** Sends the standard GraphQL introspection query through the proxy and parses the schema. */
export async function fetchGraphQLSchema(
  options: FetchSchemaOptions,
): Promise<ParsedSchema> {
  const headerRecord: Record<string, string> = {
    "Content-Type": "application/json",
  };
  for (const h of options.headers) {
    if (h.enabled && h.key) {
      headerRecord[h.key] = h.value;
    }
  }

  const bodyPayload = JSON.stringify({ query: INTROSPECTION_QUERY });

  let proxyResponse: Response;
  try {
    proxyResponse = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: options.url,
        method: "POST",
        headers: headerRecord,
        body: bodyPayload,
        sslVerify: options.sslVerify,
        followRedirects: options.followRedirects,
        timeoutMs: options.timeoutMs,
      }),
      signal: options.signal,
    });
  } catch (cause) {
    const error: RequestError = {
      type: "network",
      message: "Failed to reach the proxy for schema fetch",
      cause: cause instanceof Error ? cause.message : String(cause),
    };
    throw error;
  }

  type ProxyData = {
    status: number;
    body: string;
    error?: string;
    code?: string;
  };
  const data = (await proxyResponse.json()) as ProxyData;

  if (!proxyResponse.ok || data.error) {
    const error: RequestError = {
      type: "proxy",
      message: data.error ?? `Proxy returned ${proxyResponse.status}`,
    };
    throw error;
  }

  type IntrospectionResult = {
    data?: {
      __schema: {
        queryType: { name: string } | null;
        mutationType: { name: string } | null;
        subscriptionType: { name: string } | null;
        types: IntrospectionFullType[];
      };
    };
    errors?: { message: string }[];
  };

  let parsed: IntrospectionResult;
  try {
    parsed = JSON.parse(data.body) as IntrospectionResult;
  } catch {
    throw {
      type: "parse",
      message: "Could not parse schema response as JSON",
    } satisfies RequestError;
  }

  if (parsed.errors?.length) {
    throw {
      type: "proxy",
      message: parsed.errors[0].message,
    } satisfies RequestError;
  }

  if (!parsed.data?.__schema) {
    throw {
      type: "parse",
      message: "Response does not contain a valid GraphQL schema",
    } satisfies RequestError;
  }

  const schema = parsed.data.__schema;

  // Filter out built-in types (those starting with __)
  const userTypes = schema.types.filter((t) => !t.name.startsWith("__"));

  return {
    queryTypeName: schema.queryType?.name ?? null,
    mutationTypeName: schema.mutationType?.name ?? null,
    subscriptionTypeName: schema.subscriptionType?.name ?? null,
    types: userTypes,
  };
}

export { DEFAULT_REQUEST_TIMEOUT_MS };
