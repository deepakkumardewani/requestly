import type {
  AuthConfig,
  BodyConfig,
  HttpMethod,
  KVPair,
  ResponseData,
} from "@/types";

export type ChainNodeType = "api" | "delay" | "condition" | "display";

export type DelayNodeConfig = {
  id: string;
  type: "delay";
  delayMs: number; // e.g. 2000
};

export type ConditionBranch = {
  id: string;
  label: string; // e.g. "admin", "else"
  expression: string; // e.g. "== 'admin'", empty string for else branch
};

export type ConditionNodeConfig = {
  id: string;
  type: "condition";
  variable: string; // e.g. "{{role}}"
  branches: ConditionBranch[];
};

export type DisplayNodeConfig = {
  id: string;
  type: "display";
  sourceJsonPath: string; // e.g. "$.data.token"
  targetField: "url" | "path" | "header" | "body";
  targetKey: string; // header name, URL param, or body JSONPath
  targetUrl?: string; // optional URL override for path injections
};

export const CONTROL_FLOW_NODE_TYPES: ChainNodeType[] = ["delay", "condition"];

export type ChainInjection = {
  sourceJsonPath: string; // e.g. "$.data.token"
  targetField: "url" | "path" | "header" | "body";
  targetKey: string; // header name, URL param name, or body JSONPath
};

export type ChainEdge = {
  id: string;
  sourceRequestId: string;
  targetRequestId: string;
  /** Shared URL template for path injections — contains :paramName placeholders. */
  targetUrl?: string;
  /** One or more extraction→injection mappings for this dependency. */
  injections: ChainInjection[];
  /** Set on edges originating from a condition node — identifies the branch handle. */
  branchId?: string;
};

/** Coerce a legacy flat-shaped edge (pre-injections array) to the current shape. */
export function migrateEdge(
  raw: Omit<ChainEdge, "injections"> & {
    sourceJsonPath?: string;
    targetField?: string;
    targetKey?: string;
    injections?: ChainInjection[];
  },
): ChainEdge {
  if (raw.injections?.length) return raw as ChainEdge;
  return {
    id: raw.id,
    sourceRequestId: raw.sourceRequestId,
    targetRequestId: raw.targetRequestId,
    targetUrl: raw.targetUrl,
    branchId: raw.branchId,
    injections: [
      {
        sourceJsonPath: raw.sourceJsonPath ?? "$.value",
        targetField: (raw.targetField ??
          "header") as ChainInjection["targetField"],
        targetKey: raw.targetKey ?? "value",
      },
    ],
  };
}

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

export type AssertionOperator =
  | "eq"
  | "neq"
  | "contains"
  | "not_contains"
  | "gt"
  | "lt"
  | "exists"
  | "not_exists"
  | "matches_regex";

export const ASSERTION_OPERATOR_LABELS: Record<AssertionOperator, string> = {
  eq: "equals",
  neq: "not equals",
  contains: "contains",
  not_contains: "not contains",
  gt: "greater than",
  lt: "less than",
  exists: "exists",
  not_exists: "not exists",
  matches_regex: "matches regex",
};

export type ChainAssertion = {
  id: string;
  source: "status" | "jsonpath" | "header";
  sourcePath?: string; // JSONPath expression or header name
  operator: AssertionOperator;
  expectedValue?: string; // not required for exists/not_exists
  enabled: boolean;
};

export type AssertionResult = {
  assertionId: string;
  passed: boolean;
  actual: string | null;
};

export type EnvPromotion = {
  edgeId: string; // which edge's extracted value to promote
  envId: string; // target environment id
  envVarName: string; // key to write into the environment
};

export type ChainConfig = {
  collectionId: string;
  edges: ChainEdge[];
  nodePositions: Record<string, { x: number; y: number }>;
  /** Explicit list of collection request IDs in this chain. undefined = legacy (show all). */
  nodeIds?: string[];
  historyNodes?: ChainHistoryNode[];
  nodeAssertions?: Record<string, ChainAssertion[]>;
  delayNodes?: DelayNodeConfig[];
  conditionNodes?: ConditionNodeConfig[];
  displayNodes?: DisplayNodeConfig[];
  envPromotions?: EnvPromotion[];
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
  nodeAssertions?: Record<string, ChainAssertion[]>;
  delayNodes?: DelayNodeConfig[];
  conditionNodes?: ConditionNodeConfig[];
  displayNodes?: DisplayNodeConfig[];
  envPromotions?: EnvPromotion[];
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
    assertionResults?: AssertionResult[];
    /** For condition nodes: the winning branch ID after evaluation. */
    activeBranchId?: string;
  }
>;
