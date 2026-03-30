"use client";

import {
  ArrowLeft,
  GitBranch,
  Play,
  Square,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { ChainCanvas } from "@/components/chain/ChainCanvas";
import { Button } from "@/components/ui/button";
import { runChain } from "@/lib/chainRunner";
import { useChainStore } from "@/stores/useChainStore";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import type { ChainConfig, ChainRunState } from "@/types/chain";

type Props = {
  params: Promise<{ collectionId: string }>;
};

export default function ChainPage({ params }: Props) {
  const { collectionId } = use(params);
  const { collections, requests, hydrate } = useCollectionsStore();
  const { configs, loadConfig, clearEdges } = useChainStore();

  const [runState, setRunState] = useState<ChainRunState>({});
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Hydrate collection data
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Load chain config for this collection
  useEffect(() => {
    loadConfig(collectionId);
  }, [collectionId, loadConfig]);

  const collection = collections.find((c) => c.id === collectionId);
  const collectionRequests = requests.filter(
    (r) => r.collectionId === collectionId,
  );

  const config: ChainConfig = configs[collectionId] ?? {
    collectionId,
    edges: [],
    nodePositions: {},
  };

  const handleRun = useCallback(async () => {
    if (isRunning) return;

    // Reset run state
    const initial: ChainRunState = {};
    for (const req of collectionRequests) {
      initial[req.id] = { state: "idle", extractedValues: {} };
    }
    setRunState(initial);
    setIsRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await runChain(
        collectionRequests,
        config.edges,
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
  }, [isRunning, collectionRequests, config.edges]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleClearEdges = useCallback(() => {
    clearEdges(collectionId);
    setRunState({});
  }, [collectionId, clearEdges]);

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
          <span className="text-sm font-semibold">
            {collection?.name ?? "Chain View"}
          </span>
          <span className="text-xs text-muted-foreground">
            — {collectionRequests.length} request
            {collectionRequests.length !== 1 ? "s" : ""}
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
              disabled={collectionRequests.length === 0}
            >
              <Play className="h-3 w-3 fill-current" />
              Run Chain
            </Button>
          )}
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        {collectionRequests.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <GitBranch className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No requests in this collection
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add requests to the collection first, then return here to chain
                them.
              </p>
            </div>
          </div>
        ) : (
          <ChainCanvas
            collectionId={collectionId}
            requests={collectionRequests}
            config={config}
            runState={runState}
            isRunning={isRunning}
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
    </div>
  );
}
