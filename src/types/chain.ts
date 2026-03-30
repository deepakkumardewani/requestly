import type { ResponseData } from "@/types";

export type ChainEdge = {
  id: string;
  sourceRequestId: string;
  targetRequestId: string;
  sourceJsonPath: string; // e.g. "$.data.token"
  targetField: "url" | "header" | "body";
  targetKey: string; // header name, URL param name, or body JSONPath
};

export type ChainConfig = {
  collectionId: string;
  edges: ChainEdge[];
  nodePositions: Record<string, { x: number; y: number }>;
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
  }
>;
