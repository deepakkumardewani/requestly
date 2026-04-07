// Types matching the static JSON schema in public/data/hub/{slug}/

export type HubKVPair = {
  key: string;
  value: string;
  enabled: boolean;
};

export type HubBody = {
  // hub uses "x-www-form-urlencoded"; mapped to internal "urlencoded"
  type: string;
  content: string;
};

export type HubRequest = {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: HubKVPair[];
  params: HubKVPair[];
  body: HubBody;
  description?: string;
};

export type HubCollection = {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  requests: HubRequest[];
};

export type HubVariable = {
  key: string;
  value: string;
  secret: boolean;
};

export type HubEnvironment = {
  id: string;
  name: string;
  variables: HubVariable[];
};

export type HubMeta = {
  name: string;
  providerName: string;
  description: string;
  category: string;
  logoUrl: string;
  docsUrl: string;
  specUrl?: string;
  version?: string;
  // Manually added to each meta.json to avoid loading collection.json just for a count
  requestCount?: number;
};

export type HubEntry = {
  slug: string;
  meta: HubMeta;
  collection: HubCollection;
  environment: HubEnvironment;
};
