"use client";

import { GitBranch, Play, Square, Trash2 } from "lucide-react";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { ApiPickerDialog } from "@/components/chain/ApiPickerDialog";
import { ChainCanvas } from "@/components/chain/ChainCanvas";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { Button } from "@/components/ui/button";
import { buildExecutionOrder, runChain } from "@/lib/chainRunner";
import { generateId } from "@/lib/utils";
import { useChainStore } from "@/stores/useChainStore";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useStandaloneChainStore } from "@/stores/useStandaloneChainStore";
import type { RequestModel } from "@/types";
import type {
  ChainAssertion,
  ChainConfig,
  ChainEdge,
  ChainHistoryNode,
  ChainRunState,
  ConditionNodeConfig,
  DelayNodeConfig,
  EnvPromotion,
  StandaloneChain,
} from "@/types/chain";

type Props = {
  params: Promise<{ collectionId: string }>;
};

function historyNodeToRequestModel(node: ChainHistoryNode): RequestModel {
  return {
    id: node.id,
    collectionId: "", // signals "not a saved collection request"
    name: node.name,
    method: node.method,
    url: node.url,
    params: node.params,
    headers: node.headers,
    auth: node.auth,
    body: node.body,
    preScript: "",
    postScript: "",
    createdAt: 0,
    updatedAt: 0,
  };
}

export default function ChainPage({ params }: Props) {
  const { collectionId: id } = use(params);

  const {
    collections,
    requests: allRequests,
    hydrate: hydrateCollections,
  } = useCollectionsStore();
  const { hydrate: hydrateHistory } = useHistoryStore();
  const {
    configs,
    loadConfig,
    clearEdges: clearCollectionEdges,
    initNodeIds,
    addNode: addCollectionNode,
    removeNode: removeCollectionNode,
    addHistoryNode: addCollectionHistoryNode,
    removeHistoryNode: removeCollectionHistoryNode,
    upsertEdge: upsertCollectionEdge,
    deleteEdge: deleteCollectionEdge,
    updateNodePosition: updateCollectionNodePosition,
    upsertNodeAssertions: upsertCollectionNodeAssertions,
    upsertDelayNode: upsertCollectionDelayNode,
    removeDelayNode: removeCollectionDelayNode,
    upsertConditionNode: upsertCollectionConditionNode,
    removeConditionNode: removeCollectionConditionNode,
    upsertEnvPromotion: upsertCollectionEnvPromotion,
    deleteEnvPromotion: deleteCollectionEnvPromotion,
  } = useChainStore();
  const {
    chains: standaloneChains,
    hydrate: hydrateStandaloneChains,
    clearEdges: clearStandaloneEdges,
    addNode: addStandaloneNode,
    removeNode: removeStandaloneNode,
    addHistoryNode: addStandaloneHistoryNode,
    removeHistoryNode: removeStandaloneHistoryNode,
    upsertEdge: upsertStandaloneEdge,
    deleteEdge: deleteStandaloneEdge,
    updateNodePosition: updateStandaloneNodePosition,
    upsertNodeAssertions: upsertStandaloneNodeAssertions,
    upsertDelayNode: upsertStandaloneDelayNode,
    removeDelayNode: removeStandaloneDelayNode,
    upsertConditionNode: upsertStandaloneConditionNode,
    removeConditionNode: removeStandaloneConditionNode,
    upsertEnvPromotion: upsertStandaloneEnvPromotion,
    deleteEnvPromotion: deleteStandaloneEnvPromotion,
  } = useStandaloneChainStore();

  const { environments, updateEnv } = useEnvironmentsStore();

  const [runState, setRunState] = useState<ChainRunState>({});
  const [isRunning, setIsRunning] = useState(false);
  const [apiPickerOpen, setApiPickerOpen] = useState(false);
  // Tracks which node triggered "Add API after this" so the new node can be positioned relative to it
  const [addAfterNodeId, setAddAfterNodeId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Mode detection
  const collection = collections.find((c) => c.id === id);
  const standaloneChain = standaloneChains[id] as StandaloneChain | undefined;
  const isCollectionChain = !!collection;

  useEffect(() => {
    hydrateCollections();
    hydrateHistory();
    hydrateStandaloneChains();
    if (isCollectionChain) loadConfig(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Backwards-compat migration: populate nodeIds when opening an old collection chain
  const configLoaded = configs[id] !== undefined;
  const collectionRequests = allRequests.filter((r) => r.collectionId === id);
  useEffect(() => {
    if (!configLoaded || !isCollectionChain) return;
    const config = configs[id];
    if (config.nodeIds !== undefined) return;
    initNodeIds(
      id,
      collectionRequests.map((r) => r.id),
    );
    // Intentionally minimal deps — fires once when config loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configLoaded, id, isCollectionChain]);

  // Derive the unified config object (edges, nodePositions, nodeIds, historyNodes)
  const collectionConfig: ChainConfig = configs[id] ?? {
    collectionId: id,
    edges: [],
    nodePositions: {},
  };

  const activeConfig = isCollectionChain ? collectionConfig : standaloneChain;

  // Derive active requests for the canvas
  const activeCollectionRequests = isCollectionChain
    ? collectionConfig.nodeIds === undefined
      ? collectionRequests
      : collectionRequests.filter((r) =>
          collectionConfig.nodeIds?.includes(r.id),
        )
    : allRequests.filter(
        (r) => standaloneChain?.nodeIds.includes(r.id) ?? false,
      );

  const historyAsRequests = (activeConfig?.historyNodes ?? []).map(
    historyNodeToRequestModel,
  );

  const chainRequests = [...activeCollectionRequests, ...historyAsRequests];

  // Unified node/edge operation delegates
  const handleAddNode = useCallback(
    (requestId: string) => {
      if (isCollectionChain) addCollectionNode(id, requestId);
      else addStandaloneNode(id, requestId);
    },
    [id, isCollectionChain, addCollectionNode, addStandaloneNode],
  );

  const handleAddHistoryNode = useCallback(
    (node: ChainHistoryNode) => {
      if (isCollectionChain) addCollectionHistoryNode(id, node);
      else addStandaloneHistoryNode(id, node);
    },
    [id, isCollectionChain, addCollectionHistoryNode, addStandaloneHistoryNode],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const isDelayNode = (activeConfig?.delayNodes ?? []).some(
        (n) => n.id === nodeId,
      );
      const isConditionNode = (activeConfig?.conditionNodes ?? []).some(
        (n) => n.id === nodeId,
      );
      const isHistoryNode = (activeConfig?.historyNodes ?? []).some(
        (n) => n.id === nodeId,
      );

      if (isDelayNode) {
        if (isCollectionChain) removeCollectionDelayNode(id, nodeId);
        else removeStandaloneDelayNode(id, nodeId);
      } else if (isConditionNode) {
        if (isCollectionChain) removeCollectionConditionNode(id, nodeId);
        else removeStandaloneConditionNode(id, nodeId);
      } else if (isCollectionChain) {
        if (isHistoryNode) removeCollectionHistoryNode(id, nodeId);
        else removeCollectionNode(id, nodeId);
      } else {
        if (isHistoryNode) removeStandaloneHistoryNode(id, nodeId);
        else removeStandaloneNode(id, nodeId);
      }
    },
    [
      id,
      isCollectionChain,
      activeConfig,
      removeCollectionNode,
      removeCollectionHistoryNode,
      removeStandaloneNode,
      removeStandaloneHistoryNode,
      removeCollectionDelayNode,
      removeStandaloneDelayNode,
      removeCollectionConditionNode,
      removeStandaloneConditionNode,
    ],
  );

  const handleUpsertDelayNode = useCallback(
    (node: DelayNodeConfig) => {
      if (isCollectionChain) upsertCollectionDelayNode(id, node);
      else upsertStandaloneDelayNode(id, node);
    },
    [
      id,
      isCollectionChain,
      upsertCollectionDelayNode,
      upsertStandaloneDelayNode,
    ],
  );

  const handleUpsertConditionNode = useCallback(
    (node: ConditionNodeConfig) => {
      if (isCollectionChain) upsertCollectionConditionNode(id, node);
      else upsertStandaloneConditionNode(id, node);
    },
    [
      id,
      isCollectionChain,
      upsertCollectionConditionNode,
      upsertStandaloneConditionNode,
    ],
  );

  const handleRemoveConditionNode = useCallback(
    (nodeId: string) => {
      if (isCollectionChain) removeCollectionConditionNode(id, nodeId);
      else removeStandaloneConditionNode(id, nodeId);
    },
    [
      id,
      isCollectionChain,
      removeCollectionConditionNode,
      removeStandaloneConditionNode,
    ],
  );

  const handleUpsertEdge = useCallback(
    (edge: Parameters<typeof upsertCollectionEdge>[1]) => {
      if (isCollectionChain) upsertCollectionEdge(id, edge);
      else upsertStandaloneEdge(id, edge);
    },
    [id, isCollectionChain, upsertCollectionEdge, upsertStandaloneEdge],
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      if (isCollectionChain) deleteCollectionEdge(id, edgeId);
      else deleteStandaloneEdge(id, edgeId);
    },
    [id, isCollectionChain, deleteCollectionEdge, deleteStandaloneEdge],
  );

  const handleUpdateNodePosition = useCallback(
    (nodeId: string, pos: { x: number; y: number }) => {
      if (isCollectionChain) updateCollectionNodePosition(id, nodeId, pos);
      else updateStandaloneNodePosition(id, nodeId, pos);
    },
    [
      id,
      isCollectionChain,
      updateCollectionNodePosition,
      updateStandaloneNodePosition,
    ],
  );

  // Runtime callback — writes an extracted value into an environment variable.
  // Uses currentValue so it doesn't permanently overwrite the saved initialValue.
  const handlePromoteToEnv = useCallback(
    (envId: string, varName: string, value: string) => {
      const env = environments.find((e) => e.id === envId);
      if (!env) return;
      const existingIdx = env.variables.findIndex((v) => v.key === varName);
      if (existingIdx >= 0) {
        const updatedVars = env.variables.map((v, idx) =>
          idx === existingIdx ? { ...v, currentValue: value } : v,
        );
        updateEnv(envId, { variables: updatedVars });
      } else {
        updateEnv(envId, {
          variables: [
            ...env.variables,
            {
              id: generateId(),
              key: varName,
              initialValue: value,
              currentValue: value,
              isSecret: false,
            },
          ],
        });
      }
    },
    [environments, updateEnv],
  );

  const handleRunSubset = useCallback(
    async (
      subsetRequests: RequestModel[],
      subsetEdges: ChainEdge[],
      subsetDelayNodes?: DelayNodeConfig[],
      subsetConditionNodes?: ConditionNodeConfig[],
    ) => {
      if (isRunning) return;
      setIsRunning(true);
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await runChain(
          subsetRequests,
          subsetEdges,
          (nodeId, state, data) => {
            setRunState((prev) => ({
              ...prev,
              [nodeId]: {
                state,
                extractedValues: data.extractedValues ?? {},
                response: data.response,
                assertionResults: data.assertionResults,
                activeBranchId: data.activeBranchId,
              },
            }));
          },
          controller.signal,
          activeConfig?.nodeAssertions,
          subsetDelayNodes,
          subsetConditionNodes,
          activeConfig?.envPromotions,
          handlePromoteToEnv,
        );
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [
      isRunning,
      activeConfig?.nodeAssertions,
      activeConfig?.envPromotions,
      handlePromoteToEnv,
    ],
  );

  const handleRunUpTo = useCallback(
    async (requestId: string) => {
      if (isRunning) return;
      const cfIds = [
        ...(activeConfig?.delayNodes ?? []).map((n) => n.id),
        ...(activeConfig?.conditionNodes ?? []).map((n) => n.id),
      ];
      let order: string[];
      try {
        order = buildExecutionOrder(
          chainRequests,
          activeConfig?.edges ?? [],
          cfIds,
        );
      } catch {
        return;
      }
      const idx = order.indexOf(requestId);
      if (idx === -1) return;
      const subsetIds = new Set(order.slice(0, idx + 1));
      const subsetRequests = chainRequests.filter((r) => subsetIds.has(r.id));
      const subsetEdges = (activeConfig?.edges ?? []).filter(
        (e) =>
          subsetIds.has(e.sourceRequestId) && subsetIds.has(e.targetRequestId),
      );
      const subsetDelay = (activeConfig?.delayNodes ?? []).filter((n) =>
        subsetIds.has(n.id),
      );
      const subsetCondition = (activeConfig?.conditionNodes ?? []).filter((n) =>
        subsetIds.has(n.id),
      );
      const initial: ChainRunState = {};
      for (const nodeId of subsetIds) {
        initial[nodeId] = { state: "idle", extractedValues: {} };
      }
      setRunState(initial);
      await handleRunSubset(
        subsetRequests,
        subsetEdges,
        subsetDelay,
        subsetCondition,
      );
    },
    [isRunning, chainRequests, activeConfig, handleRunSubset],
  );

  const handleRunFromHere = useCallback(
    async (requestId: string) => {
      if (isRunning) return;
      const cfIds = [
        ...(activeConfig?.delayNodes ?? []).map((n) => n.id),
        ...(activeConfig?.conditionNodes ?? []).map((n) => n.id),
      ];
      let order: string[];
      try {
        order = buildExecutionOrder(
          chainRequests,
          activeConfig?.edges ?? [],
          cfIds,
        );
      } catch {
        return;
      }
      const idx = order.indexOf(requestId);
      if (idx === -1) return;
      const subsetIds = new Set(order.slice(idx));
      const subsetRequests = chainRequests.filter((r) => subsetIds.has(r.id));
      const subsetEdges = (activeConfig?.edges ?? []).filter(
        (e) =>
          subsetIds.has(e.sourceRequestId) && subsetIds.has(e.targetRequestId),
      );
      const subsetDelay = (activeConfig?.delayNodes ?? []).filter((n) =>
        subsetIds.has(n.id),
      );
      const subsetCondition = (activeConfig?.conditionNodes ?? []).filter((n) =>
        subsetIds.has(n.id),
      );
      setRunState((prev) => {
        const next = { ...prev };
        for (const nodeId of subsetIds) {
          next[nodeId] = { state: "idle", extractedValues: {} };
        }
        return next;
      });
      await handleRunSubset(
        subsetRequests,
        subsetEdges,
        subsetDelay,
        subsetCondition,
      );
    },
    [isRunning, chainRequests, activeConfig, handleRunSubset],
  );

  const handleUpsertNodeAssertions = useCallback(
    (requestId: string, assertions: ChainAssertion[]) => {
      if (isCollectionChain)
        upsertCollectionNodeAssertions(id, requestId, assertions);
      else upsertStandaloneNodeAssertions(id, requestId, assertions);
    },
    [
      id,
      isCollectionChain,
      upsertCollectionNodeAssertions,
      upsertStandaloneNodeAssertions,
    ],
  );

  const handleAddAfterNode = useCallback((requestId: string) => {
    setAddAfterNodeId(requestId);
    setApiPickerOpen(true);
  }, []);

  const handleUpsertEnvPromotion = useCallback(
    (promotion: EnvPromotion) => {
      if (isCollectionChain) upsertCollectionEnvPromotion(id, promotion);
      else upsertStandaloneEnvPromotion(id, promotion);
    },
    [
      id,
      isCollectionChain,
      upsertCollectionEnvPromotion,
      upsertStandaloneEnvPromotion,
    ],
  );

  const handleDeleteEnvPromotion = useCallback(
    (edgeId: string) => {
      if (isCollectionChain) deleteCollectionEnvPromotion(id, edgeId);
      else deleteStandaloneEnvPromotion(id, edgeId);
    },
    [
      id,
      isCollectionChain,
      deleteCollectionEnvPromotion,
      deleteStandaloneEnvPromotion,
    ],
  );

  // Wraps handleAddNode to also position the new node 320px right of the source
  const handlePickerAddRequest = useCallback(
    (requestId: string) => {
      handleAddNode(requestId);
      if (addAfterNodeId !== null) {
        const sourcePos = activeConfig?.nodePositions?.[addAfterNodeId];
        if (sourcePos) {
          handleUpdateNodePosition(requestId, {
            x: sourcePos.x + 320,
            y: sourcePos.y,
          });
        }
        setAddAfterNodeId(null);
      }
    },
    [addAfterNodeId, handleAddNode, handleUpdateNodePosition, activeConfig],
  );

  const handlePickerClose = useCallback(() => {
    setApiPickerOpen(false);
    setAddAfterNodeId(null);
  }, []);

  const handleRun = useCallback(async () => {
    if (isRunning) return;

    const delayNodes = activeConfig?.delayNodes ?? [];
    const conditionNodes = activeConfig?.conditionNodes ?? [];

    const initial: ChainRunState = {};
    for (const req of chainRequests) {
      initial[req.id] = { state: "idle", extractedValues: {} };
    }
    for (const n of delayNodes) {
      initial[n.id] = { state: "idle", extractedValues: {} };
    }
    for (const n of conditionNodes) {
      initial[n.id] = { state: "idle", extractedValues: {} };
    }
    setRunState(initial);
    setIsRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await runChain(
        chainRequests,
        activeConfig?.edges ?? [],
        (nodeId, state, data) => {
          setRunState((prev) => ({
            ...prev,
            [nodeId]: {
              state,
              extractedValues: data.extractedValues ?? {},
              response: data.response,
              assertionResults: data.assertionResults,
              activeBranchId: data.activeBranchId,
            },
          }));
        },
        controller.signal,
        activeConfig?.nodeAssertions,
        delayNodes,
        conditionNodes,
        activeConfig?.envPromotions,
        handlePromoteToEnv,
      );
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [isRunning, chainRequests, activeConfig]);

  const handleRunSingleNode = useCallback(
    async (requestId: string) => {
      if (isRunning) return;
      const req = chainRequests.find((r) => r.id === requestId);
      if (!req) return;

      setRunState((prev) => ({
        ...prev,
        [requestId]: { ...prev[requestId], state: "running" },
      }));

      try {
        const controller = new AbortController();
        // Run just this single request with no edges
        await runChain(
          [req],
          [],
          (id, state, data) => {
            setRunState((prev) => ({
              ...prev,
              [id]: {
                state,
                extractedValues: data.extractedValues ?? {},
                response: data.response,
              },
            }));
          },
          controller.signal,
        );
      } catch (err) {
        console.error("Failed to run single node", err);
        setRunState((prev) => ({
          ...prev,
          [requestId]: { ...prev[requestId], state: "failed" },
        }));
      }
    },
    [isRunning, chainRequests],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleClearEdges = useCallback(() => {
    if (isCollectionChain) clearCollectionEdges(id);
    else clearStandaloneEdges(id);
    setRunState({});
  }, [id, isCollectionChain, clearCollectionEdges, clearStandaloneEdges]);

  const passedCount = Object.values(runState).filter(
    (s) => s.state === "passed",
  ).length;
  const failedCount = Object.values(runState).filter(
    (s) => s.state === "failed",
  ).length;
  const skippedCount = Object.values(runState).filter(
    (s) => s.state === "skipped",
  ).length;
  const hasRunResult = Object.keys(runState).length > 0;

  const chainTitle = isCollectionChain
    ? (collection?.name ?? "Chain View")
    : (standaloneChain?.name ?? "Chain");

  const alreadyAddedIds = new Set([
    ...(collectionConfig.nodeIds ?? collectionRequests.map((r) => r.id)),
    ...(standaloneChain?.nodeIds ?? []),
    ...(activeConfig?.historyNodes ?? []).flatMap((n) => [
      n.id,
      n.historyEntryId,
    ]),
  ]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <AppBreadcrumb
          items={[{ label: "Home", href: "/" }, { label: chainTitle }]}
        />
        <span className="text-xs text-muted-foreground ml-2">
          — {chainRequests.length} request
          {chainRequests.length !== 1 ? "s" : ""}
        </span>

        <div className="flex-1" />

        {/* Run result summary */}
        {hasRunResult && !isRunning && (
          <div className="flex items-center gap-2 text-xs">
            {passedCount > 0 && (
              <span className="flex items-center gap-0.5 text-emerald-400">
                <span className="font-semibold">{passedCount}</span> passed
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-0.5 text-red-400">
                <span className="font-semibold">{failedCount}</span> failed
              </span>
            )}
            {skippedCount > 0 && (
              <span className="flex items-center gap-0.5 text-zinc-400">
                <span className="font-semibold">{skippedCount}</span> skipped
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            onClick={handleClearEdges}
            disabled={isRunning}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear edges
          </Button>

          {isRunning ? (
            <Button
              variant="destructive"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleStop}
            >
              <Square className="h-3 w-3 fill-current" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-7 gap-1.5 text-xs bg-primary hover:bg-primary/90"
              onClick={handleRun}
              disabled={chainRequests.length === 0}
            >
              <Play className="h-3 w-3 fill-current" />
              Run Chain
            </Button>
          )}
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        {chainRequests.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <GitBranch className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No APIs in this chain
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Use the Add API button to add requests from your collections or
                history.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5 text-xs"
                onClick={() => setApiPickerOpen(true)}
              >
                Add API
              </Button>
            </div>
          </div>
        ) : (
          <ChainCanvas
            chainId={id}
            requests={chainRequests}
            edges={activeConfig?.edges ?? []}
            nodePositions={activeConfig?.nodePositions ?? {}}
            nodeAssertions={activeConfig?.nodeAssertions ?? {}}
            runState={runState}
            isRunning={isRunning}
            delayNodes={activeConfig?.delayNodes ?? []}
            conditionNodes={activeConfig?.conditionNodes ?? []}
            onAddApiClick={() => setApiPickerOpen(true)}
            onDeleteNode={handleDeleteNode}
            onUpsertEdge={handleUpsertEdge}
            onDeleteEdge={handleDeleteEdge}
            onUpdateNodePosition={handleUpdateNodePosition}
            onUpsertNodeAssertions={handleUpsertNodeAssertions}
            onRunNode={handleRunSingleNode}
            onRunUpTo={handleRunUpTo}
            onRunFromHere={handleRunFromHere}
            onAddAfterNode={handleAddAfterNode}
            onUpsertDelayNode={handleUpsertDelayNode}
            onUpsertConditionNode={handleUpsertConditionNode}
            onRemoveConditionNode={handleRemoveConditionNode}
            envPromotions={activeConfig?.envPromotions ?? []}
            onSavePromotion={handleUpsertEnvPromotion}
            onRemovePromotion={handleDeleteEnvPromotion}
          />
        )}
      </div>

      {/* Bottom hint */}
      <div className="flex h-7 shrink-0 items-center justify-center border-t border-border bg-card/50">
        <p className="text-[10px] text-muted-foreground">
          Drag nodes to reposition · Draw from right handle to left handle to
          create a dependency · Click an edge to configure it · Delete/Backspace
          to remove edges
        </p>
      </div>

      <ApiPickerDialog
        open={apiPickerOpen}
        onClose={handlePickerClose}
        onAddRequest={handlePickerAddRequest}
        onAddHistoryNode={handleAddHistoryNode}
        alreadyAddedIds={alreadyAddedIds}
      />
    </div>
  );
}
