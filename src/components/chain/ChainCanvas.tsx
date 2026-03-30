"use client";

import {
  Background,
  type Connection,
  Controls,
  type Edge,
  type EdgeMouseHandler,
  MiniMap,
  type Node,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChainStore } from "@/stores/useChainStore";
import { generateId } from "@/lib/utils";
import type { RequestModel } from "@/types";
import type {
  ChainConfig,
  ChainEdge,
  ChainNodeState,
  ChainRunState,
} from "@/types/chain";
import { ArrowConfigPanel } from "./ArrowConfigPanel";
import { ChainNode, type ChainNodeData } from "./ChainNode";

const NODE_TYPES = { chainNode: ChainNode };

function buildNodes(
  requests: RequestModel[],
  nodePositions: Record<string, { x: number; y: number }>,
  runState: ChainRunState,
): Node<ChainNodeData>[] {
  return requests.map((req, idx) => ({
    id: req.id,
    type: "chainNode",
    position: nodePositions[req.id] ?? { x: idx * 280 + 40, y: 120 },
    data: {
      requestId: req.id,
      name: req.name,
      method: req.method,
      url: req.url,
      state: (runState[req.id]?.state ?? "idle") as ChainNodeState,
    },
  }));
}

function buildEdges(
  chainEdges: ChainEdge[],
  runState: ChainRunState,
): Edge[] {
  return chainEdges.map((e) => {
    const srcState = runState[e.sourceRequestId];
    const extracted = srcState?.extractedValues?.[e.id];
    let label = e.sourceJsonPath;
    let labelStyle: React.CSSProperties = {
      fontSize: 10,
      fill: "#94a3b8",
    };

    if (extracted !== null && extracted !== undefined) {
      label = `${e.sourceJsonPath} = ${String(extracted).slice(0, 20)}`;
      labelStyle = { fontSize: 10, fill: "#4ade80" };
    } else if (extracted === null && srcState) {
      label = `✗ ${e.sourceJsonPath}`;
      labelStyle = { fontSize: 10, fill: "#f87171" };
    }

    return {
      id: e.id,
      source: e.sourceRequestId,
      target: e.targetRequestId,
      label,
      labelStyle,
      labelBgStyle: { fill: "#1e293b", fillOpacity: 0.85 },
      labelBgPadding: [4, 6] as [number, number],
      style: { stroke: "#475569", strokeWidth: 2 },
      animated: false,
    };
  });
}

type ChainCanvasProps = {
  collectionId: string;
  requests: RequestModel[];
  config: ChainConfig;
  runState: ChainRunState;
  isRunning: boolean;
};

export function ChainCanvas({
  collectionId,
  requests,
  config,
  runState,
  isRunning,
}: ChainCanvasProps) {
  const { upsertEdge, deleteEdge, updateNodePosition } = useChainStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ChainNodeData>>(
    buildNodes(requests, config.nodePositions, runState),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    buildEdges(config.edges, runState),
  );

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelEdge, setPanelEdge] = useState<ChainEdge | null>(null);
  const pendingConnectionRef = useRef<{
    sourceId: string;
    targetId: string;
  } | null>(null);

  // Sync nodes when runState changes (update state indicators)
  useEffect(() => {
    setNodes(buildNodes(requests, config.nodePositions, runState));
  }, [runState, requests, config.nodePositions, setNodes]);

  // Sync edges when config or runState changes
  useEffect(() => {
    setEdges(buildEdges(config.edges, runState));
  }, [config.edges, runState, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // Guard against self-loop
      if (connection.source === connection.target) return;

      pendingConnectionRef.current = {
        sourceId: connection.source,
        targetId: connection.target,
      };

      // Open config panel for a new edge
      setPanelEdge(null);
      setPanelOpen(true);
    },
    [],
  );

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_evt, edge) => {
      const chainEdge = config.edges.find((e) => e.id === edge.id);
      if (chainEdge) {
        setPanelEdge(chainEdge);
        setPanelOpen(true);
      }
    },
    [config.edges],
  );

  const onNodeDragStop = useCallback(
    (_evt: React.MouseEvent, node: Node) => {
      updateNodePosition(collectionId, node.id, node.position as { x: number; y: number });
    },
    [collectionId, updateNodePosition],
  );

  const onKeyDown = useCallback(
    (evt: React.KeyboardEvent) => {
      if (evt.key === "Delete" || evt.key === "Backspace") {
        // edges deletion handled by onEdgesChange via React Flow's built-in delete
      }
    },
    [],
  );

  // Handle edge deletion via React Flow's built-in delete key
  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      for (const change of changes) {
        if (change.type === "remove") {
          deleteEdge(collectionId, change.id);
        }
      }
    },
    [collectionId, deleteEdge, onEdgesChange],
  );

  const handleSaveEdge = (edge: ChainEdge) => {
    if (pendingConnectionRef.current) {
      const newEdge: ChainEdge = {
        ...edge,
        id: generateId(),
        sourceRequestId: pendingConnectionRef.current.sourceId,
        targetRequestId: pendingConnectionRef.current.targetId,
      };
      upsertEdge(collectionId, newEdge);
      pendingConnectionRef.current = null;
      setEdges((eds) =>
        addEdge(
          {
            id: newEdge.id,
            source: newEdge.sourceRequestId,
            target: newEdge.targetRequestId,
            label: newEdge.sourceJsonPath,
            style: { stroke: "#475569", strokeWidth: 2 },
          },
          eds,
        ),
      );
    } else if (panelEdge) {
      upsertEdge(collectionId, edge);
    }
  };

  const handleDeleteEdge = (edgeId: string) => {
    deleteEdge(collectionId, edgeId);
  };

  const sourceRequest = panelOpen
    ? requests.find(
        (r) =>
          r.id === (pendingConnectionRef.current?.sourceId ?? panelEdge?.sourceRequestId),
      ) ?? null
    : null;

  const targetRequest = panelOpen
    ? requests.find(
        (r) =>
          r.id === (pendingConnectionRef.current?.targetId ?? panelEdge?.targetRequestId),
      ) ?? null
    : null;

  return (
    <div className="h-full w-full" onKeyDown={onKeyDown}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onNodeDragStop={onNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={["Backspace", "Delete"]}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Background color="#1e293b" gap={24} />
        <Controls
          className="!bg-card !border-border !rounded-lg"
          showInteractive={!isRunning}
        />
        <MiniMap
          nodeColor={(node) => {
            const state = (node.data as ChainNodeData)?.state ?? "idle";
            const colors: Record<ChainNodeState, string> = {
              idle: "#374151",
              running: "#3b82f6",
              passed: "#10b981",
              failed: "#ef4444",
              skipped: "#6b7280",
            };
            return colors[state as ChainNodeState];
          }}
          className="!bg-card !border-border !rounded-lg"
          maskColor="rgba(0,0,0,0.4)"
        />
      </ReactFlow>

      <ArrowConfigPanel
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setPanelEdge(null);
          pendingConnectionRef.current = null;
        }}
        sourceRequest={sourceRequest}
        targetRequest={targetRequest}
        existingEdge={panelEdge}
        onSave={handleSaveEdge}
        onDelete={handleDeleteEdge}
      />
    </div>
  );
}
