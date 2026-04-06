import { JSONPath } from "jsonpath-plus";
import { evaluateAllAssertions } from "@/lib/chainAssertions";
import {
  buildVarValues,
  evaluateCondition,
  resolveDelay,
} from "@/lib/chainControlFlow";
import { runRequest } from "@/lib/requestRunner";
import type { RequestModel } from "@/types";
import type {
  AssertionResult,
  ChainAssertion,
  ChainEdge,
  ChainInjection,
  ChainNodeState,
  ChainRunState,
  ConditionNodeConfig,
  DelayNodeConfig,
  DisplayNodeConfig,
  EnvPromotion,
} from "@/types/chain";

export class CircularDependencyError extends Error {
  constructor() {
    super("Circular dependency detected in chain");
    this.name = "CircularDependencyError";
  }
}

/**
 * Topological sort (Kahn's algorithm) returning an ordered array of node IDs.
 * `extraNodeIds` adds delay/condition node IDs into the topology alongside API requests.
 * Throws CircularDependencyError if a cycle is detected.
 */
export function buildExecutionOrder(
  requests: RequestModel[],
  edges: ChainEdge[],
  extraNodeIds: string[] = [],
): string[] {
  const ids = [...requests.map((r) => r.id), ...extraNodeIds];
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of ids) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const edge of edges) {
    const src = edge.sourceRequestId;
    const tgt = edge.targetRequestId;
    if (!inDegree.has(src) || !inDegree.has(tgt)) continue;
    inDegree.set(tgt, (inDegree.get(tgt) ?? 0) + 1);
    adjacency.get(src)?.push(tgt);
  }

  const queue = ids.filter((id) => (inDegree.get(id) ?? 0) === 0);
  const order: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) break;
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
 * Apply a single injection mapping to a request, returning a mutated copy.
 */
function applyInjection(
  request: RequestModel,
  injection: ChainInjection,
  value: string,
  targetUrl?: string,
): RequestModel {
  const req = JSON.parse(JSON.stringify(request)) as RequestModel; // deep clone

  if (injection.targetField === "header") {
    const existing = req.headers.find((h) => h.key === injection.targetKey);
    if (existing) {
      existing.value = value;
    } else {
      req.headers.push({
        id: crypto.randomUUID(),
        key: injection.targetKey,
        value,
        enabled: true,
      });
    }
  } else if (injection.targetField === "url") {
    const separator = req.url.includes("?") ? "&" : "?";
    req.url = `${req.url}${separator}${encodeURIComponent(injection.targetKey)}=${encodeURIComponent(value)}`;
  } else if (injection.targetField === "path") {
    const baseUrl = targetUrl ?? req.url;
    const placeholder = `:${injection.targetKey}`;
    if (baseUrl.includes(placeholder)) {
      req.url = baseUrl.replace(placeholder, encodeURIComponent(value));
    } else {
      req.url = `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(value)}`;
    }
  } else if (injection.targetField === "body") {
    try {
      const bodyObj = JSON.parse(req.body.content ?? "{}");
      const key = injection.targetKey.replace(/^\$\./, "");
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
      req.body = { ...req.body, content: (req.body.content ?? "") + value };
    }
  }

  return req;
}

type OnUpdateFn = (
  nodeId: string,
  state: ChainNodeState,
  data: {
    response?: import("@/types").ResponseData;
    extractedValues?: Record<string, string | null>;
    error?: string;
    assertionResults?: AssertionResult[];
    activeBranchId?: string;
  },
) => void;

/**
 * Run a full request chain in dependency order, calling onUpdate for each step.
 * Delay and condition nodes are handled alongside API request nodes.
 */
export async function runChain(
  requests: RequestModel[],
  edges: ChainEdge[],
  onUpdate: OnUpdateFn,
  signal: AbortSignal,
  nodeAssertions?: Record<string, ChainAssertion[]>,
  delayNodes?: DelayNodeConfig[],
  conditionNodes?: ConditionNodeConfig[],
  envPromotions?: EnvPromotion[],
  onPromoteToEnv?: (envId: string, varName: string, value: string) => void,
  displayNodes?: DisplayNodeConfig[],
): Promise<void> {
  const delayNodeMap = new Map<string, DelayNodeConfig>(
    (delayNodes ?? []).map((n) => [n.id, n]),
  );
  const conditionNodeMap = new Map<string, ConditionNodeConfig>(
    (conditionNodes ?? []).map((n) => [n.id, n]),
  );
  const displayNodeMap = new Map<string, DisplayNodeConfig>(
    (displayNodes ?? []).map((n) => [n.id, n]),
  );
  const controlFlowIds = [
    ...(delayNodes ?? []).map((n) => n.id),
    ...(conditionNodes ?? []).map((n) => n.id),
    ...(displayNodes ?? []).map((n) => n.id),
  ];

  let order: string[];
  try {
    order = buildExecutionOrder(requests, edges, controlFlowIds);
  } catch (err) {
    if (err instanceof CircularDependencyError) {
      const allIds = [...requests.map((r) => r.id), ...controlFlowIds];
      for (const id of allIds) {
        onUpdate(id, "skipped", { error: "Circular dependency detected" });
      }
      return;
    }
    throw err;
  }

  const requestMap = new Map<string, RequestModel>(
    requests.map((r) => [r.id, r]),
  );

  const runState: ChainRunState = {};

  for (const nodeId of order) {
    if (signal.aborted) {
      for (const remainingId of order.slice(order.indexOf(nodeId))) {
        if (!runState[remainingId]) {
          onUpdate(remainingId, "skipped", { error: "Run stopped" });
          runState[remainingId] = { state: "skipped", extractedValues: {} };
        }
      }
      return;
    }

    const incomingEdges = edges.filter((e) => e.targetRequestId === nodeId);

    // Check for upstream failure or branch mismatch
    const hasDependencyFailure = incomingEdges.some((e) => {
      const srcState = runState[e.sourceRequestId];
      if (!srcState || srcState.state === "skipped") {
        return true;
      }

      // Success handle: only follow if source passed
      if (e.branchId === "success") {
        return srcState.state !== "passed";
      }

      // Fail handle: only follow if source failed (failed is the expected path here)
      if (e.branchId === "fail") {
        return srcState.state !== "failed";
      }

      // A failed source blocks non-conditional downstream nodes
      if (srcState.state === "failed") {
        return true;
      }

      // For routing edges from condition nodes: check winning branch
      if (e.branchId !== undefined && srcState.activeBranchId !== undefined) {
        return srcState.activeBranchId !== e.branchId;
      }
      return false;
    });

    if (hasDependencyFailure) {
      const errMsg = "Dependency failed or skipped upstream";
      onUpdate(nodeId, "skipped", { error: errMsg });
      runState[nodeId] = {
        state: "skipped",
        extractedValues: {},
        error: errMsg,
      };
      continue;
    }

    // ── Delay node ────────────────────────────────────────────────────────────
    const delayNode = delayNodeMap.get(nodeId);
    if (delayNode) {
      onUpdate(nodeId, "running", {});
      try {
        await resolveDelay(delayNode, signal);
        runState[nodeId] = { state: "passed", extractedValues: {} };
        onUpdate(nodeId, "passed", {});
      } catch {
        const isAborted = signal.aborted;
        const state: ChainNodeState = isAborted ? "skipped" : "failed";
        const error = isAborted ? "Run stopped" : "Delay interrupted";
        runState[nodeId] = { state, extractedValues: {}, error };
        onUpdate(nodeId, state, { error });
      }
      continue;
    }

    // ── Condition node ────────────────────────────────────────────────────────
    const conditionNode = conditionNodeMap.get(nodeId);
    if (conditionNode) {
      onUpdate(nodeId, "running", {});

      // Extract values from non-routing incoming edges
      const extractedValues: Record<string, string | null> = {};
      for (const edge of incomingEdges) {
        if (edge.branchId) continue; // routing edge — no extraction needed
        const srcState = runState[edge.sourceRequestId];
        const response = srcState?.response;
        if (!response) {
          extractedValues[edge.id] = null;
          continue;
        }
        // For condition nodes, use the first injection's path to extract the variable to test
        const condJsonPath = edge.injections?.[0]?.sourceJsonPath ?? "";
        extractedValues[edge.id] = condJsonPath
          ? extractJsonPath(response.body, condJsonPath)
          : null;
      }

      const varValues = buildVarValues(incomingEdges, extractedValues);
      const winningBranchId = evaluateCondition(conditionNode, varValues);

      if (winningBranchId === null) {
        const error = "No branch matched";
        runState[nodeId] = { state: "failed", extractedValues, error };
        onUpdate(nodeId, "failed", { error });
      } else {
        runState[nodeId] = {
          state: "passed",
          extractedValues,
          activeBranchId: winningBranchId,
        };
        onUpdate(nodeId, "passed", {
          extractedValues,
          activeBranchId: winningBranchId,
        });
      }
      continue;
    }

    // ── Display node ──────────────────────────────────────────────────────────
    const displayNode = displayNodeMap.get(nodeId);
    if (displayNode) {
      onUpdate(nodeId, "running", {});

      // Find the inbound edge to locate the source response
      const inboundEdge = incomingEdges[0];
      const sourceState = inboundEdge
        ? runState[inboundEdge.sourceRequestId]
        : undefined;
      const sourceResponse = sourceState?.response;

      if (!sourceResponse || !displayNode.sourceJsonPath) {
        const error = !sourceResponse
          ? "No response from source node"
          : "Display node has no extraction path configured";
        runState[nodeId] = { state: "failed", extractedValues: {}, error };
        onUpdate(nodeId, "failed", { error });
        continue;
      }

      const extracted = extractJsonPath(
        sourceResponse.body,
        displayNode.sourceJsonPath,
      );
      const extractedValues: Record<string, string | null> = {
        [nodeId]: extracted,
      };

      if (extracted === null) {
        const error = `Could not extract "${displayNode.sourceJsonPath}" from source response`;
        runState[nodeId] = { state: "failed", extractedValues, error };
        onUpdate(nodeId, "failed", { extractedValues, error });
        continue;
      }

      runState[nodeId] = { state: "passed", extractedValues };
      onUpdate(nodeId, "passed", { extractedValues });
      continue;
    }

    // ── API request node ──────────────────────────────────────────────────────
    const request = requestMap.get(nodeId);
    if (!request) continue;

    onUpdate(nodeId, "running", {});

    // Only extract from non-routing edges
    const extractionEdges = incomingEdges.filter((e) => !e.branchId);
    let mutatedRequest = request;
    const extractedValues: Record<string, string | null> = {};

    for (const edge of extractionEdges) {
      const srcState = runState[edge.sourceRequestId];
      const sourceIsDisplay = displayNodeMap.has(edge.sourceRequestId);
      const displayCfg = displayNodeMap.get(edge.sourceRequestId);

      // DisplayNode edges use the display node's single injection config
      const injections = displayCfg
        ? [
            {
              sourceJsonPath: displayCfg.sourceJsonPath,
              targetField: displayCfg.targetField,
              targetKey: displayCfg.targetKey,
            },
          ]
        : (edge.injections ?? []);

      const sourceResponse = sourceIsDisplay ? null : srcState?.response;
      if (!sourceIsDisplay && !sourceResponse) {
        extractedValues[edge.id] = null;
        continue;
      }

      let edgeHadFailure = false;

      for (const injection of injections) {
        let extracted: string | null;
        if (sourceIsDisplay) {
          extracted = srcState?.extractedValues?.[edge.sourceRequestId] ?? null;
        } else {
          extracted = sourceResponse
            ? extractJsonPath(sourceResponse.body, injection.sourceJsonPath)
            : null;
        }

        // Key per injection so we can track individual failures
        const valueKey = `${edge.id}:${injection.sourceJsonPath}`;
        extractedValues[valueKey] = extracted;
        // Keep the top-level edge key for backward compat with failure check
        if (extracted === null) {
          edgeHadFailure = true;
        }

        if (extracted !== null) {
          mutatedRequest = applyInjection(
            mutatedRequest,
            injection,
            extracted,
            displayCfg?.targetUrl ?? edge.targetUrl,
          );
          const promotion = envPromotions?.find((p) => p.edgeId === edge.id);
          if (promotion) {
            onPromoteToEnv?.(promotion.envId, promotion.envVarName, extracted);
          }
        }
      }

      if (edgeHadFailure) {
        extractedValues[edge.id] = null;
      }
    }

    // If any extraction failed, skip this node
    const extractionFailed = extractionEdges.some(
      (e) => extractedValues[e.id] === null,
    );

    if (extractionFailed && extractionEdges.length > 0) {
      const errMsg = "Could not extract value from source response";
      onUpdate(nodeId, "skipped", { extractedValues, error: errMsg });
      runState[nodeId] = { state: "skipped", extractedValues, error: errMsg };
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

      const httpPassed = response.status >= 200 && response.status < 300;
      const errorMsg = httpPassed
        ? undefined
        : `HTTP ${response.status} ${response.statusText}`;

      const assertions = nodeAssertions?.[nodeId] ?? [];
      const assertionResults =
        assertions.length > 0
          ? evaluateAllAssertions(assertions, response)
          : undefined;

      const assertionsFailed =
        assertionResults?.some((r) => !r.passed) ?? false;
      const state: ChainNodeState =
        httpPassed && !assertionsFailed ? "passed" : "failed";

      const finalError =
        errorMsg ??
        (assertionsFailed ? "One or more assertions failed" : undefined);

      runState[nodeId] = {
        state,
        extractedValues,
        response,
        error: finalError,
        assertionResults,
      };
      onUpdate(nodeId, state, {
        response,
        extractedValues,
        error: finalError,
        assertionResults,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Request failed";
      runState[nodeId] = { state: "failed", extractedValues, error };
      onUpdate(nodeId, "failed", { extractedValues, error });
    }
  }
}
