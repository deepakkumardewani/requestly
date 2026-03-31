"use client";

import {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  type EdgeMouseHandler,
  MiniMap,
  type Node,
  type NodeMouseHandler,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LayoutGrid, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { computeAutoLayout } from "@/lib/chainLayout";
import { generateId } from "@/lib/utils";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import type { RequestModel } from "@/types";
import type {
  ChainAssertion,
  ChainEdge,
  ChainNodeState,
  ChainRunState,
} from "@/types/chain";
import { ArrowConfigPanel } from "./ArrowConfigPanel";
import { ChainNode, type ChainNodeData } from "./ChainNode";
import { NodeContextMenu } from "./NodeContextMenu";
import { NodeDetailsPanel } from "./NodeDetailsPanel";

const NODE_TYPES = { chainNode: ChainNode };

function buildNodes(
  requests: RequestModel[],
  nodePositions: Record<string, { x: number; y: number }>,
  runState: ChainRunState,
  onClickNode: (requestId: string) => void,
  onDeleteNode: (nodeId: string) => void,
  onRunNode?: (nodeId: string) => void,
): Node<ChainNodeData>[] {
  return requests.map((req, idx) => {
    const nodeState = runState[req.id];
    return {
      id: req.id,
      type: "chainNode",
      position: nodePositions[req.id] ?? { x: idx * 280 + 40, y: 120 },
      data: {
        requestId: req.id,
        name: req.name,
        method: req.method,
        url: req.url,
        state: (nodeState?.state ?? "idle") as ChainNodeState,
        response: nodeState?.response,
        extractedValues: nodeState?.extractedValues,
        onClickNode,
        onDeleteNode,
        onRunNode,
      },
    };
  });
}

function buildEdges(chainEdges: ChainEdge[], runState: ChainRunState): Edge[] {
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

type ContextMenuState = {
  x: number;
  y: number;
  requestId: string;
};

type ChainCanvasProps = {
  chainId: string;
  requests: RequestModel[];
  edges: ChainEdge[];
  nodePositions: Record<string, { x: number; y: number }>;
  nodeAssertions: Record<string, ChainAssertion[]>;
  runState: ChainRunState;
  isRunning: boolean;
  onAddApiClick: () => void;
  onDeleteNode: (nodeId: string) => void;
  onUpsertEdge: (edge: ChainEdge) => void;
  onDeleteEdge: (edgeId: string) => void;
  onUpdateNodePosition: (nodeId: string, pos: { x: number; y: number }) => void;
  onUpsertNodeAssertions: (
    requestId: string,
    assertions: ChainAssertion[],
  ) => void;
  onRunNode?: (nodeId: string) => void;
  onRunUpTo: (requestId: string) => void;
  onRunFromHere: (requestId: string) => void;
  onAddAfterNode: (requestId: string) => void;
};

// Inner component rendered inside ReactFlow context so useReactFlow is available.
type AutoLayoutControlProps = {
  nodes: Node<ChainNodeData>[];
  edges: Edge[];
  disabled: boolean;
  onUpdateNodePosition: (nodeId: string, pos: { x: number; y: number }) => void;
  setNodes: React.Dispatch<React.SetStateAction<Node<ChainNodeData>[]>>;
};

function AutoLayoutControl({
  nodes,
  edges,
  disabled,
  onUpdateNodePosition,
  setNodes,
}: AutoLayoutControlProps) {
  const { fitView } = useReactFlow();

  const handleAutoLayout = useCallback(() => {
    const positions = computeAutoLayout(nodes, edges);

    // Update visual positions immediately for snappy feedback
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        position: positions[node.id] ?? node.position,
      })),
    );

    // Persist each position to the store
    for (const [id, pos] of Object.entries(positions)) {
      onUpdateNodePosition(id, pos);
    }

    // fitView after React has flushed the position changes
    requestAnimationFrame(() => fitView({ padding: 0.2 }));

    toast.success("Layout applied");
  }, [nodes, edges, setNodes, onUpdateNodePosition, fitView]);

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 gap-1.5 text-xs bg-card"
      onClick={handleAutoLayout}
      disabled={disabled}
    >
      <LayoutGrid className="h-3.5 w-3.5" />
      Auto Layout
    </Button>
  );
}

export function ChainCanvas({
  requests,
  edges: chainEdges,
  nodePositions,
  nodeAssertions,
  runState,
  isRunning,
  onAddApiClick,
  onDeleteNode,
  onUpsertEdge,
  onDeleteEdge,
  onUpdateNodePosition,
  onUpsertNodeAssertions,
  onRunNode,
  onRunUpTo,
  onRunFromHere,
  onAddAfterNode,
}: ChainCanvasProps) {
  const { updateRequest } = useCollectionsStore();

  const [nodeDetailOpen, setNodeDetailOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleClickNode = useCallback((requestId: string) => {
    setSelectedNodeId(requestId);
    setNodeDetailOpen(true);
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ChainNodeData>>(
    buildNodes(
      requests,
      nodePositions,
      runState,
      handleClickNode,
      onDeleteNode,
      onRunNode,
    ),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    buildEdges(chainEdges, runState),
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelEdge, setPanelEdge] = useState<ChainEdge | null>(null);
  const pendingConnectionRef = useRef<{
    sourceId: string;
    targetId: string;
  } | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    setNodes(
      buildNodes(
        requests,
        nodePositions,
        runState,
        handleClickNode,
        onDeleteNode,
        onRunNode,
      ),
    );
  }, [
    runState,
    requests,
    nodePositions,
    setNodes,
    handleClickNode,
    onDeleteNode,
    onRunNode,
  ]);

  useEffect(() => {
    setEdges(buildEdges(chainEdges, runState));
  }, [chainEdges, runState, setEdges]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) return;

    pendingConnectionRef.current = {
      sourceId: connection.source,
      targetId: connection.target,
    };

    setPanelEdge(null);
    setPanelOpen(true);
  }, []);

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_evt, edge) => {
      const chainEdge = chainEdges.find((e) => e.id === edge.id);
      if (chainEdge) {
        setPanelEdge(chainEdge);
        setPanelOpen(true);
      }
    },
    [chainEdges],
  );

  const onNodeDragStop = useCallback(
    (_evt: React.MouseEvent, node: Node) => {
      onUpdateNodePosition(node.id, node.position as { x: number; y: number });
    },
    [onUpdateNodePosition],
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      for (const change of changes) {
        if (change.type === "remove") {
          onDeleteEdge(change.id);
        }
      }
    },
    [onDeleteEdge, onEdgesChange],
  );

  const handleSaveEdge = (edge: ChainEdge) => {
    if (pendingConnectionRef.current) {
      const newEdge: ChainEdge = {
        ...edge,
        id: generateId(),
        sourceRequestId: pendingConnectionRef.current.sourceId,
        targetRequestId: pendingConnectionRef.current.targetId,
      };
      onUpsertEdge(newEdge);
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
      onUpsertEdge(edge);
    }
  };

  const handleDeleteEdge = (edgeId: string) => {
    onDeleteEdge(edgeId);
  };

  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, requestId: node.id });
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const sourceRequest = panelOpen
    ? (requests.find(
        (r) =>
          r.id ===
          (pendingConnectionRef.current?.sourceId ??
            panelEdge?.sourceRequestId),
      ) ?? null)
    : null;

  const targetRequest = panelOpen
    ? (requests.find(
        (r) =>
          r.id ===
          (pendingConnectionRef.current?.targetId ??
            panelEdge?.targetRequestId),
      ) ?? null)
    : null;

  const selectedRequest = requests.find((r) => r.id === selectedNodeId) ?? null;
  const selectedState = selectedNodeId ? runState[selectedNodeId] : null;
  // History nodes have collectionId = "" — body edits don't persist for them
  const canSaveBody = selectedRequest && selectedRequest.collectionId !== "";

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onNodeDragStop={onNodeDragStop}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
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

        <Panel position="top-left" className="m-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs bg-card"
            onClick={onAddApiClick}
            disabled={isRunning}
          >
            <Plus className="h-3.5 w-3.5" />
            Add API
          </Button>
          <AutoLayoutControl
            nodes={nodes}
            edges={edges}
            disabled={isRunning}
            onUpdateNodePosition={onUpdateNodePosition}
            setNodes={setNodes}
          />
        </Panel>
      </ReactFlow>

      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          requestId={contextMenu.requestId}
          onClose={() => setContextMenu(null)}
          onAddAfter={onAddAfterNode}
          onRunUpTo={onRunUpTo}
          onRunFromHere={onRunFromHere}
          onDelete={onDeleteNode}
        />
      )}

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
        sourceRunState={
          sourceRequest ? runState[sourceRequest.id]?.state : undefined
        }
        sourceResponse={
          sourceRequest ? runState[sourceRequest.id]?.response : undefined
        }
        onRunSource={onRunNode}
        onSave={handleSaveEdge}
        onDelete={handleDeleteEdge}
      />

      <NodeDetailsPanel
        open={nodeDetailOpen}
        onClose={() => {
          setNodeDetailOpen(false);
          setSelectedNodeId(null);
        }}
        name={selectedRequest?.name ?? ""}
        method={selectedRequest?.method ?? "GET"}
        url={selectedRequest?.url ?? ""}
        state={selectedState?.state ?? "idle"}
        response={selectedState?.response}
        extractedValues={selectedState?.extractedValues}
        error={selectedState?.error}
        assertionResults={selectedState?.assertionResults}
        assertions={
          selectedNodeId ? (nodeAssertions[selectedNodeId] ?? []) : []
        }
        onAssertionsChange={
          selectedNodeId
            ? (updated) => onUpsertNodeAssertions(selectedNodeId, updated)
            : undefined
        }
        bodyContent={selectedRequest?.body?.content ?? ""}
        onSaveBody={
          canSaveBody
            ? (body) => {
                updateRequest(selectedRequest.id, {
                  body: { ...selectedRequest.body, content: body },
                });
              }
            : undefined
        }
      />
    </div>
  );
}
