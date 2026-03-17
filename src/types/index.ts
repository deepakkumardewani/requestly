export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type KVPair = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  type?: "query" | "path";
};

export type AuthType = "none" | "bearer" | "basic" | "api-key";

export type AuthConfig =
  | { type: "none" }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "api-key"; key: string; value: string; addTo: "header" | "query" };

export type BodyType =
  | "none"
  | "json"
  | "xml"
  | "text"
  | "html"
  | "form-data"
  | "urlencoded";

export type BodyConfig = {
  type: BodyType;
  content: string;
  formData?: KVPair[];
};

export type TabState = {
  tabId: string;
  requestId: string | null;
  name: string;
  isDirty: boolean;
  method: HttpMethod;
  url: string;
  params: KVPair[];
  headers: KVPair[];
  auth: AuthConfig;
  body: BodyConfig;
  preScript: string;
  postScript: string;
};

export type RequestModel = {
  id: string;
  collectionId: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KVPair[];
  headers: KVPair[];
  auth: AuthConfig;
  body: BodyConfig;
  preScript: string;
  postScript: string;
  createdAt: number;
  updatedAt: number;
};

export type CollectionModel = {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
};

export type EnvVariable = {
  id: string;
  key: string;
  initialValue: string;
  currentValue: string;
  isSecret: boolean;
};

export type EnvironmentModel = {
  id: string;
  name: string;
  description?: string;
  variables: EnvVariable[];
  createdAt: number;
  updatedAt: number;
};

export type ResponseData = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
  size: number;
  url: string;
  method: HttpMethod;
  timestamp: number;
};

export type HistoryEntry = {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  duration: number;
  size: number;
  timestamp: number;
  request: TabState;
  response: ResponseData;
};

export type AppSettings = {
  theme: "dark" | "light" | "system";
  proxyUrl: string;
  sslVerify: boolean;
  followRedirects: boolean;
  showHealthMonitor: boolean;
};

export type HealthMetrics = {
  successRate: number;
  p50: number;
  p95: number;
  lastStatus: number;
  entryCount: number;
};

export type RequestError = {
  type: "network" | "timeout" | "parse" | "proxy";
  message: string;
  cause?: string;
};

export type ParsedCurl = {
  method: HttpMethod;
  url: string;
  headers: KVPair[];
  body: BodyConfig;
  auth: AuthConfig;
};
