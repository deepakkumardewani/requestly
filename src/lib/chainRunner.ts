import { JSONPath } from "jsonpath-plus";
import { runRequest } from "@/lib/requestRunner";
import type { RequestModel } from "@/types";
import type { ChainEdge, ChainNodeState, ChainRunState } from "@/types/chain";

export class CircularDependencyError extends Error {
  constructor() {
    super("Circular dependency detected in chain");
    this.name = "CircularDependencyError";
  }
}

/**
 * Topological sort (Kahn's algorithm) returning an ordered array of request IDs.
 * Throws CircularDependencyError if a cycle is detected.
 */
export function buildExecutionOrder(
  requests: RequestModel[],
  edges: ChainEdge[],
): string[] {
  const ids = requests.map((r) => r.id);
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of ids) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const edge of edges) {
    inDegree.set(
      edge.targetRequestId,
      (inDegree.get(edge.targetRequestId) ?? 0) + 1,
    );
    adjacency.get(edge.sourceRequestId)?.push(edge.targetRequestId);
  }

  const queue = ids.filter((id) => (inDegree.get(id) ?? 0) === 0);
  const order: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    for (const neighbour of adjacency.get(node) ?? []) {
      const deg = (inDegree.get(neighbour) ?? 0) - 1;
      inDegree.set(neighbour, deg);
      if (deg === 0) queue.push(neighbour);
    }
  }

  if (order.length !== ids.length) {
    throw new CircularDependencyError();
  }

  return order;
}

/**
 * Extract a value from a JSON string using a JSONPath expression.
 * Returns null if extraction fails.
 */
function extractJsonPath(
  responseBody: string,
  jsonPath: string,
): string | null {
  try {
    const parsed = JSON.parse(responseBody);
    const result = JSONPath({ path: jsonPath, json: parsed });
    if (Array.isArray(result) && result.length > 0) {
      return String(result[0]);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Apply a chain injection to a request, returning a mutated copy.
 */
function applyInjection(
  request: RequestModel,
  edge: ChainEdge,
  value: string,
): RequestModel {
  const req = JSON.parse(JSON.stringify(request)) as RequestModel; // deep clone

  if (edge.targetField === "header") {
    const existing = req.headers.find((h) => h.key === edge.targetKey);
    if (existing) {
      existing.value = value;
    } else {
      req.headers.push({
        id: crypto.randomUUID(),
        key: edge.targetKey,
        value,
        enabled: true,
      });
    }
  } else if (edge.targetField === "url") {
    const separator = req.url.includes("?") ? "&" : "?";
    req.url = `${req.url}${separator}${encodeURIComponent(edge.targetKey)}=${encodeURIComponent(value)}`;
  } else if (edge.targetField === "body") {
    try {
      const bodyObj = JSON.parse(req.body.content ?? "{}");
      // Support simple dot-notation key for body injection
      const key = edge.targetKey.replace(/^\$\./, ""); // strip $. prefix
      const keys = key.split(".");
      let obj = bodyObj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (typeof obj[keys[i]] !== "object" || obj[keys[i]] === null) {
          obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      req.body = { ...req.body, content: JSON.stringify(bodyObj, null, 2) };
    } catch {
      // If body is not JSON, append as-is
      req.body = { ...req.body, content: (req.body.content ?? "") + value };
    }
  }

  return req;
}

type OnUpdateFn = (
  requestId: string,
  state: ChainNodeState,
  data: {
    response?: import("@/types").ResponseData;
    extractedValues?: Record<string, string | null>;
    error?: string;
  },
) => void;

/**
 * Run a full request chain in dependency order, calling onUpdate for each step.
 */
export async function runChain(
  requests: RequestModel[],
  edges: ChainEdge[],
  onUpdate: OnUpdateFn,
  signal: AbortSignal,
): Promise<void> {
  let order: string[];
  try {
    order = buildExecutionOrder(requests, edges);
  } catch (err) {
    if (err instanceof CircularDependencyError) {
      for (const req of requests) {
        onUpdate(req.id, "skipped", { error: "Circular dependency detected" });
      }
      return;
    }
    throw err;
  }

  const requestMap = new Map<string, RequestModel>(
    requests.map((r) => [r.id, r]),
  );

  // Track the run state: responses and extracted values per request
  const runState: ChainRunState = {};

  for (const reqId of order) {
    if (signal.aborted) {
      // Mark remaining as skipped
      for (const remainingId of order.slice(order.indexOf(reqId))) {
        if (!runState[remainingId]) {
          onUpdate(remainingId, "skipped", { error: "Run stopped" });
          runState[remainingId] = { state: "skipped", extractedValues: {} };
        }
      }
      return;
    }

    const request = requestMap.get(reqId);
    if (!request) continue;

    // Check if any source dependency failed -> skip this node
    const incomingEdges = edges.filter((e) => e.targetRequestId === reqId);
    const hasDependencyFailure = incomingEdges.some((e) => {
      const srcState = runState[e.sourceRequestId];
      return !srcState || srcState.state === "failed" || srcState.state === "skipped";
    });

    if (hasDependencyFailure) {
      onUpdate(reqId, "skipped", { error: "Dependency failed" });
      runState[reqId] = { state: "skipped", extractedValues: {} };
      continue;
    }

    onUpdate(reqId, "running", {});

    // Apply injections from all incoming edges
    let mutatedRequest = request;
    const extractedValues: Record<string, string | null> = {};

    for (const edge of incomingEdges) {
      const srcState = runState[edge.sourceRequestId];
      const sourceResponse = srcState?.response;
      if (!sourceResponse) {
        extractedValues[edge.id] = null;
        continue;
      }

      const extracted = extractJsonPath(sourceResponse.body, edge.sourceJsonPath);
      extractedValues[edge.id] = extracted;

      if (extracted !== null) {
        mutatedRequest = applyInjection(mutatedRequest, edge, extracted);
      }
    }

    // If any extraction failed, skip downstream and mark as skipped
    const extractionFailed = incomingEdges.some(
      (e) => extractedValues[e.id] === null,
    );

    if (extractionFailed && incomingEdges.length > 0) {
      onUpdate(reqId, "skipped", {
        extractedValues,
        error: "Dependency extraction failed",
      });
      runState[reqId] = { state: "skipped", extractedValues };
      continue;
    }

    try {
      const response = await runRequest({
        method: mutatedRequest.method,
        url: mutatedRequest.url,
        headers: mutatedRequest.headers,
        body: mutatedRequest.body,
        auth: mutatedRequest.auth,
      });

      const passed = response.status >= 200 && response.status < 300;
      const state: ChainNodeState = passed ? "passed" : "failed";

      runState[reqId] = { state, extractedValues, response };
      onUpdate(reqId, state, { response, extractedValues });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Request failed";
      runState[reqId] = { state: "failed", extractedValues };
      onUpdate(reqId, "failed", { extractedValues, error });
    }
  }
}
