import type {
  AuthConfig,
  BodyConfig,
  HttpMethod,
  KVPair,
  ResponseData,
} from "@/types";

export type ChainEdge = {
  id: string;
  sourceRequestId: string;
  targetRequestId: string;
  sourceJsonPath: string; // e.g. "$.data.token"
  targetField: "url" | "path" | "header" | "body";
  targetKey: string; // header name, URL param name, or body JSONPath
  targetUrl?: string; // optional URL override (e.g. with :id placeholder)
};

/** Snapshot of a history-sourced node — not tied to any saved collection request. */
export type ChainHistoryNode = {
  id: string; // stable node ID within the chain
  historyEntryId: string; // original history entry ID (informational; snapshot is authoritative)
  name: string; // derived from URL path last segment
  method: HttpMethod;
  url: string;
  params: KVPair[];
  headers: KVPair[];
  auth: AuthConfig;
  body: BodyConfig;
};

export type ChainConfig = {
  collectionId: string;
  edges: ChainEdge[];
  nodePositions: Record<string, { x: number; y: number }>;
  /** Explicit list of collection request IDs in this chain. undefined = legacy (show all). */
  nodeIds?: string[];
  historyNodes?: ChainHistoryNode[];
};

/** A named chain not tied to any specific collection. */
export type StandaloneChain = {
  id: string;
  name: string;
  createdAt: number;
  edges: ChainEdge[];
  nodePositions: Record<string, { x: number; y: number }>;
  nodeIds: string[]; // always defined; starts empty
  historyNodes: ChainHistoryNode[];
};

export type ChainNodeState =
  | "idle"
  | "running"
  | "passed"
  | "failed"
  | "skipped";

export type ChainRunState = Record<
  string,
  {
    state: ChainNodeState;
    extractedValues: Record<string, string | null>;
    response?: ResponseData;
    error?: string;
  }
>;
