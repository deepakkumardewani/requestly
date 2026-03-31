"use client";

import { ArrowLeft, GitBranch, Play, Square, Trash2 } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { ApiPickerDialog } from "@/components/chain/ApiPickerDialog";
import { ChainCanvas } from "@/components/chain/ChainCanvas";
import { Button } from "@/components/ui/button";
import { runChain } from "@/lib/chainRunner";
import { useChainStore } from "@/stores/useChainStore";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useStandaloneChainStore } from "@/stores/useStandaloneChainStore";
import type { RequestModel } from "@/types";
import type {
  ChainConfig,
  ChainHistoryNode,
  ChainRunState,
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
  } = useStandaloneChainStore();

  const [runState, setRunState] = useState<ChainRunState>({});
  const [isRunning, setIsRunning] = useState(false);
  const [apiPickerOpen, setApiPickerOpen] = useState(false);
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
      const isHistoryNode = (activeConfig?.historyNodes ?? []).some(
        (n) => n.id === nodeId,
      );
      if (isCollectionChain) {
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

  const handleRun = useCallback(async () => {
    if (isRunning) return;

    const initial: ChainRunState = {};
    for (const req of chainRequests) {
      initial[req.id] = { state: "idle", extractedValues: {} };
    }
    setRunState(initial);
    setIsRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await runChain(
        chainRequests,
        activeConfig?.edges ?? [],
        (requestId, state, data) => {
          setRunState((prev) => ({
            ...prev,
            [requestId]: {
              state,
              extractedValues: data.extractedValues ?? {},
              response: data.response,
            },
          }));
        },
        controller.signal,
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
        <Link
          href="/"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs">Back</span>
        </Link>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <GitBranch className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{chainTitle}</span>
          <span className="text-xs text-muted-foreground">
            — {chainRequests.length} request
            {chainRequests.length !== 1 ? "s" : ""}
          </span>
        </div>

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
            runState={runState}
            isRunning={isRunning}
            onAddApiClick={() => setApiPickerOpen(true)}
            onDeleteNode={handleDeleteNode}
            onUpsertEdge={handleUpsertEdge}
            onDeleteEdge={handleDeleteEdge}
            onUpdateNodePosition={handleUpdateNodePosition}
            onRunNode={handleRunSingleNode}
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
        onClose={() => setApiPickerOpen(false)}
        onAddRequest={handleAddNode}
        onAddHistoryNode={handleAddHistoryNode}
        alreadyAddedIds={alreadyAddedIds}
      />
    </div>
  );
}
