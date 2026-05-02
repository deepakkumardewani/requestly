import { generateId } from "@/lib/utils";
import type {
  AuthConfig,
  BodyConfig,
  HttpMethod,
  KVPair,
  TabState,
} from "@/types";

export type RequestTemplate = {
  id: string;
  name: string;
  description: string;
  method: HttpMethod;
  url: string;
  headers: KVPair[];
  body: BodyConfig;
  auth: AuthConfig;
};

const NONE_AUTH: AuthConfig = { type: "none" };
const NONE_BODY: BodyConfig = { type: "none", content: "" };

export const REQUEST_TEMPLATES: RequestTemplate[] = [
  {
    id: "rest-get",
    name: "REST GET",
    description: "Simple GET request to a REST endpoint",
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/posts",
    headers: [
      {
        id: generateId(),
        key: "Accept",
        value: "application/json",
        enabled: true,
      },
    ],
    body: NONE_BODY,
    auth: NONE_AUTH,
  },
  {
    id: "rest-post-json",
    name: "REST POST (JSON)",
    description: "POST request with a JSON body",
    method: "POST",
    url: "https://jsonplaceholder.typicode.com/posts",
    headers: [
      {
        id: generateId(),
        key: "Content-Type",
        value: "application/json",
        enabled: true,
      },
      {
        id: generateId(),
        key: "Accept",
        value: "application/json",
        enabled: true,
      },
    ],
    body: {
      type: "json",
      content: JSON.stringify(
        { title: "foo", body: "bar", userId: 1 },
        null,
        2,
      ),
    },
    auth: NONE_AUTH,
  },
  {
    id: "bearer-auth",
    name: "Bearer Auth",
    description: "Request with Bearer token authentication header",
    method: "GET",
    url: "https://api.example.com/me",
    headers: [
      {
        id: generateId(),
        key: "Authorization",
        value: "Bearer {{token}}",
        enabled: true,
      },
      {
        id: generateId(),
        key: "Accept",
        value: "application/json",
        enabled: true,
      },
    ],
    body: NONE_BODY,
    auth: { type: "bearer", token: "{{token}}" },
  },
  {
    id: "multipart-upload",
    name: "Multipart File Upload",
    description: "POST request with multipart/form-data body",
    method: "POST",
    url: "https://api.example.com/upload",
    headers: [],
    body: {
      type: "form-data",
      content: "",
      formData: [
        { id: generateId(), key: "file", value: "", enabled: true },
        {
          id: generateId(),
          key: "description",
          value: "My file",
          enabled: true,
        },
      ],
    },
    auth: NONE_AUTH,
  },
  {
    id: "webhook-post",
    name: "Webhook (POST JSON)",
    description: "Simulate an outbound webhook with a JSON payload",
    method: "POST",
    url: "https://webhook.site/{{webhook_id}}",
    headers: [
      {
        id: generateId(),
        key: "Content-Type",
        value: "application/json",
        enabled: true,
      },
      {
        id: generateId(),
        key: "X-Webhook-Secret",
        value: "{{webhook_secret}}",
        enabled: true,
      },
    ],
    body: {
      type: "json",
      content: JSON.stringify(
        {
          event: "user.created",
          data: { id: "{{user_id}}", email: "{{email}}" },
        },
        null,
        2,
      ),
    },
    auth: NONE_AUTH,
  },
  {
    id: "graphql-query",
    name: "GraphQL Query",
    description: "GraphQL POST request with query and variables",
    method: "POST",
    url: "https://countries.trevorblades.com/graphql",
    headers: [
      {
        id: generateId(),
        key: "Content-Type",
        value: "application/json",
        enabled: true,
      },
    ],
    body: {
      type: "json",
      content: JSON.stringify(
        {
          query: `query GetCountries {\n  countries {\n    code\n    name\n    emoji\n  }\n}`,
          variables: {},
        },
        null,
        2,
      ),
    },
    auth: NONE_AUTH,
  },
];

export function templateToTabState(
  template: RequestTemplate,
): Partial<TabState> {
  return {
    type: "http",
    name: template.name,
    url: template.url,
    method: template.method,
    headers: template.headers,
    body: template.body,
    auth: template.auth,
    params: [],
    preScript: "",
    postScript: "",
    isDirty: false,
  };
}
