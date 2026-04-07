import { generateId } from "@/lib/utils";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import type {
  BodyType,
  CollectionModel,
  EnvironmentModel,
  EnvVariable,
  HttpMethod,
  KVPair,
  RequestModel,
} from "@/types";
import type {
  HubCollection,
  HubEnvironment,
  HubKVPair,
  HubMeta,
  HubRequest,
} from "@/types/hub";

const IMPORTED_SLUGS_KEY = "requestly_imported_hub_slugs";

// Hub uses "x-www-form-urlencoded"; our BodyType uses "urlencoded"
function mapHubBodyType(type: string): BodyType {
  if (type === "x-www-form-urlencoded") return "urlencoded";
  const valid: BodyType[] = [
    "none",
    "json",
    "xml",
    "text",
    "html",
    "form-data",
    "urlencoded",
  ];
  return valid.includes(type as BodyType) ? (type as BodyType) : "none";
}

function mapHubKVPairs(pairs: HubKVPair[]): KVPair[] {
  return pairs.map((p) => ({ id: generateId(), ...p }));
}

function mapHubRequest(hubReq: HubRequest, collectionId: string): RequestModel {
  return {
    id: generateId(),
    collectionId,
    name: hubReq.name,
    method: hubReq.method as HttpMethod,
    url: hubReq.url,
    params: mapHubKVPairs(hubReq.params),
    headers: mapHubKVPairs(hubReq.headers),
    auth: { type: "none" },
    body: {
      type: mapHubBodyType(hubReq.body.type),
      content: hubReq.body.content,
    },
    preScript: "",
    postScript: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function mapHubEnvironment(
  hubEnv: HubEnvironment,
  meta: HubMeta,
): EnvironmentModel {
  const variables: EnvVariable[] = hubEnv.variables.map((v) => ({
    id: generateId(),
    key: v.key,
    initialValue: v.value,
    currentValue: v.value,
    isSecret: v.secret,
  }));

  return {
    id: generateId(),
    name: meta.name,
    variables,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function getImportedSlugs(): Set<string> {
  try {
    const raw = localStorage.getItem(IMPORTED_SLUGS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markSlugImported(slug: string): void {
  const current = getImportedSlugs();
  current.add(slug);
  localStorage.setItem(IMPORTED_SLUGS_KEY, JSON.stringify([...current]));
}

export function importHubEntry(
  slug: string,
  hubCollection: HubCollection,
  hubEnv: HubEnvironment,
  meta: HubMeta,
): void {
  const now = Date.now();

  const collection: CollectionModel = {
    id: generateId(),
    name: meta.name,
    description: hubCollection.description,
    createdAt: now,
    updatedAt: now,
  };

  const requests: RequestModel[] = hubCollection.requests.map((r) =>
    mapHubRequest(r, collection.id),
  );

  useCollectionsStore.getState().bulkImportCollection(collection, requests);

  const environment = mapHubEnvironment(hubEnv, meta);
  useEnvironmentsStore.getState().importEnv(environment);

  markSlugImported(slug);
}
