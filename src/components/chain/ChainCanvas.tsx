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
import { GitBranch, LayoutGrid, Plus, Timer } from "lucide-react";
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
  ConditionNodeConfig,
  DelayNodeConfig,
  EnvPromotion,
} from "@/types/chain";
import { ArrowConfigPanel } from "./ArrowConfigPanel";
import { ChainNode, type ChainNodeData } from "./ChainNode";
import { ConditionConfigPanel } from "./ConditionConfigPanel";
import { ConditionNode, type ConditionNodeData } from "./ConditionNode";
import { DelayNode, type DelayNodeData } from "./DelayNode";
import { NodeContextMenu } from "./NodeContextMenu";
import { NodeDetailsPanel } from "./NodeDetailsPanel";

const NODE_TYPES = {
  chainNode: ChainNode,
  delayNode: DelayNode,
  conditionNode: ConditionNode,
};

// ── Node builders ────────────────────────────────────────────────────────────

function buildApiNodes(
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

function buildDelayNodes(
  delayNodes: DelayNodeConfig[],
  nodePositions: Record<string, { x: number; y: number }>,
  runState: ChainRunState,
  onUpdateDelay: (id: string, delayMs: number) => void,
  onDeleteNode: (nodeId: string) => void,
): Node<DelayNodeData>[] {
  return delayNodes.map((dn, idx) => {
    const nodeState = runState[dn.id];
    return {
      id: dn.id,
      type: "delayNode",
      position: nodePositions[dn.id] ?? { x: idx * 200 + 40, y: 260 },
      data: {
        nodeId: dn.id,
        delayMs: dn.delayMs,
        state: (nodeState?.state ?? "idle") as ChainNodeState,
        error: nodeState?.error,
        onUpdateDelay,
        onDeleteNode,
      },
    };
  });
}

function buildConditionNodes(
  conditionNodes: ConditionNodeConfig[],
  nodePositions: Record<string, { x: number; y: number }>,
  runState: ChainRunState,
  onDeleteNode: (nodeId: string) => void,
): Node<ConditionNodeData>[] {
  return conditionNodes.map((cn, idx) => {
    const nodeState = runState[cn.id];
    return {
      id: cn.id,
      type: "conditionNode",
      position: nodePositions[cn.id] ?? { x: idx * 200 + 40, y: 400 },
      data: {
        nodeId: cn.id,
        variable: cn.variable,
        branches: cn.branches,
        state: (nodeState?.state ?? "idle") as ChainNodeState,
        activeBranchId: nodeState?.activeBranchId,
        error: nodeState?.error,
        onDeleteNode,
      },
    };
  });
}

function buildEdges(
  chainEdges: ChainEdge[],
  runState: ChainRunState,
  conditionNodes: ConditionNodeConfig[],
): Edge[] {
  return chainEdges.map((e) => {
    // Routing edge from a condition node — show branch label
    if (e.branchId) {
      const condNode = conditionNodes.find((cn) => cn.id === e.sourceRequestId);
      const branch = condNode?.branches.find((b) => b.id === e.branchId);
      const label = branch?.label || e.branchId;
      return {
        id: e.id,
        source: e.sourceRequestId,
        target: e.targetRequestId,
        sourceHandle: e.branchId,
        label,
        labelStyle: { fontSize: 10, fill: "#a78bfa" },
        labelBgStyle: { fill: "#1e293b", fillOpacity: 0.85 },
        labelBgPadding: [4, 6] as [number, number],
        style: { stroke: "#7c3aed", strokeWidth: 2, strokeDasharray: "4 2" },
        animated: false,
      };
    }

    // Standard extraction edge
    const srcState = runState[e.sourceRequestId];
    const extracted = srcState?.extractedValues?.[e.id];
    let label = e.sourceJsonPath;
    let labelStyle: React.CSSProperties = { fontSize: 10, fill: "#94a3b8" };

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

// ── Types ────────────────────────────────────────────────────────────────────

type ContextMenuState = {
  x: number;
  y: number;
  nodeId: string;
  nodeType: "api" | "delay" | "condition";
};

type ChainCanvasProps = {
  chainId: string;
  requests: RequestModel[];
  edges: ChainEdge[];
  nodePositions: Record<string, { x: number; y: number }>;
  nodeAssertions: Record<string, ChainAssertion[]>;
  runState: ChainRunState;
  isRunning: boolean;
  delayNodes: DelayNodeConfig[];
  conditionNodes: ConditionNodeConfig[];
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
  onUpsertDelayNode: (node: DelayNodeConfig) => void;
  onUpsertConditionNode: (node: ConditionNodeConfig) => void;
  onRemoveConditionNode: (nodeId: string) => void;
  envPromotions?: EnvPromotion[];
  onSavePromotion?: (promotion: EnvPromotion) => void;
  onRemovePromotion?: (edgeId: string) => void;
};

// ── Auto-layout control (must live inside ReactFlow context) ─────────────────

// AutoLayoutControl only reads node.id / node.position and spreads the rest,
// so a structural widening to the base Node type is safe here.
type LayoutNode = Node<{ [key: string]: unknown }>;

type AutoLayoutControlProps = {
  nodes: LayoutNode[];
  edges: Edge[];
  disabled: boolean;
  onUpdateNodePosition: (nodeId: string, pos: { x: number; y: number }) => void;
  setNodes: React.Dispatch<React.SetStateAction<LayoutNode[]>>;
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

    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        position: positions[node.id] ?? node.position,
      })),
    );

    for (const [id, pos] of Object.entries(positions)) {
      onUpdateNodePosition(id, pos);
    }

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

// Must render inside <ReactFlow> so useReactFlow() has provider context
type ControlFlowToolbarProps = {
  disabled: boolean;
  onUpsertDelayNode: (node: DelayNodeConfig) => void;
  onUpsertConditionNode: (node: ConditionNodeConfig) => void;
  onUpdateNodePosition: (nodeId: string, pos: { x: number; y: number }) => void;
  onOpenConditionPanel: (nodeId: string) => void;
};

function ControlFlowToolbar({
  disabled,
  onUpsertDelayNode,
  onUpsertConditionNode,
  onUpdateNodePosition,
  onOpenConditionPanel,
}: ControlFlowToolbarProps) {
  const { screenToFlowPosition } = useReactFlow();

  const handleAddDelayNode = useCallback(() => {
    const id = generateId();
    const pos = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    onUpsertDelayNode({ id, type: "delay", delayMs: 1000 });
    onUpdateNodePosition(id, pos);
  }, [screenToFlowPosition, onUpsertDelayNode, onUpdateNodePosition]);

  const handleAddConditionNode = useCallback(() => {
    const id = generateId();
    const pos = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    onUpsertConditionNode({
      id,
      type: "condition",
      variable: "{{value}}",
      branches: [
        { id: generateId(), label: "branch 1", expression: "== 'value'" },
        { id: generateId(), label: "else", expression: "" },
      ],
    });
    onUpdateNodePosition(id, pos);
    onOpenConditionPanel(id);
  }, [
    screenToFlowPosition,
    onUpsertConditionNode,
    onUpdateNodePosition,
    onOpenConditionPanel,
  ]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 text-xs bg-card"
        onClick={handleAddDelayNode}
        disabled={disabled}
      >
        <Timer className="h-3.5 w-3.5 text-amber-400" />
        Add Delay
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 text-xs bg-card"
        onClick={handleAddConditionNode}
        disabled={disabled}
      >
        <GitBranch className="h-3.5 w-3.5 text-violet-400" />
        Add Condition
      </Button>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChainCanvas({
  requests,
  edges: chainEdges,
  nodePositions,
  nodeAssertions,
  runState,
  isRunning,
  delayNodes,
  conditionNodes,
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
  onUpsertDelayNode,
  onUpsertConditionNode,
  onRemoveConditionNode,
  envPromotions,
  onSavePromotion,
  onRemovePromotion,
}: ChainCanvasProps) {
  const { updateRequest } = useCollectionsStore();

  const [nodeDetailOpen, setNodeDetailOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [conditionPanelNodeId, setConditionPanelNodeId] = useState<
    string | null
  >(null);

  const handleClickNode = useCallback((requestId: string) => {
    setSelectedNodeId(requestId);
    setNodeDetailOpen(true);
  }, []);

  const handleUpdateDelay = useCallback(
    (id: string, delayMs: number) => {
      const node = delayNodes.find((n) => n.id === id);
      if (!node) return;
      onUpsertDelayNode({ ...node, delayMs });
    },
    [delayNodes, onUpsertDelayNode],
  );

  // Build all React Flow nodes from all three node types
  function buildAllNodes() {
    return [
      ...buildApiNodes(
        requests,
        nodePositions,
        runState,
        handleClickNode,
        onDeleteNode,
        onRunNode,
      ),
      ...buildDelayNodes(
        delayNodes,
        nodePositions,
        runState,
        handleUpdateDelay,
        onDeleteNode,
      ),
      ...buildConditionNodes(
        conditionNodes,
        nodePositions,
        runState,
        onDeleteNode,
      ),
    ];
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(buildAllNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    buildEdges(chainEdges, runState, conditionNodes),
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelEdge, setPanelEdge] = useState<ChainEdge | null>(null);
  const pendingConnectionRef = useRef<{
    sourceId: string;
    targetId: string;
  } | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Sync nodes whenever any data source changes
  useEffect(() => {
    setNodes(buildAllNodes());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    runState,
    requests,
    nodePositions,
    delayNodes,
    conditionNodes,
    handleClickNode,
    onDeleteNode,
    onRunNode,
    handleUpdateDelay,
  ]);

  useEffect(() => {
    setEdges(buildEdges(chainEdges, runState, conditionNodes));
  }, [chainEdges, runState, conditionNodes, setEdges]);

  const conditionNodeIds = new Set(conditionNodes.map((n) => n.id));
  const delayNodeIds = new Set(delayNodes.map((n) => n.id));

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      const isConditionSource =
        conditionNodeIds.has(connection.source) &&
        connection.sourceHandle !== null &&
        connection.sourceHandle !== undefined;

      const isDelaySource = delayNodeIds.has(connection.source);

      if (isConditionSource || isDelaySource) {
        // Auto-create a routing edge — no ArrowConfigPanel needed
        const newEdge: ChainEdge = {
          id: generateId(),
          sourceRequestId: connection.source,
          targetRequestId: connection.target,
          sourceJsonPath: "",
          targetField: "url",
          targetKey: "",
          branchId: connection.sourceHandle ?? undefined,
        };
        onUpsertEdge(newEdge);

        const condNode = conditionNodes.find(
          (cn) => cn.id === connection.source,
        );
        const branch = condNode?.branches.find(
          (b) => b.id === connection.sourceHandle,
        );
        const label = branch?.label ?? connection.sourceHandle ?? "";

        setEdges((eds) =>
          addEdge(
            {
              id: newEdge.id,
              source: newEdge.sourceRequestId,
              target: newEdge.targetRequestId,
              sourceHandle: newEdge.branchId,
              label,
              labelStyle: { fontSize: 10, fill: "#a78bfa" },
              labelBgStyle: { fill: "#1e293b", fillOpacity: 0.85 },
              labelBgPadding: [4, 6] as [number, number],
              style: {
                stroke: "#7c3aed",
                strokeWidth: 2,
                strokeDasharray: "4 2",
              },
            },
            eds,
          ),
        );
        return;
      }

      pendingConnectionRef.current = {
        sourceId: connection.source,
        targetId: connection.target,
      };
      setPanelEdge(null);
      setPanelOpen(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conditionNodeIds, delayNodeIds, conditionNodes, onUpsertEdge, setEdges],
  );

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_evt, edge) => {
      const chainEdge = chainEdges.find((e) => e.id === edge.id);
      if (chainEdge && !chainEdge.branchId) {
        // Only open config panel for extraction edges, not routing edges
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

  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      const nodeType = conditionNodeIds.has(node.id)
        ? "condition"
        : delayNodeIds.has(node.id)
          ? "delay"
          : "api";
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeType,
      });
    },
    [conditionNodeIds, delayNodeIds],
  );

  const onNodeDoubleClick: NodeMouseHandler = useCallback((_evt, node) => {
    if (node.type === "conditionNode") {
      setConditionPanelNodeId(node.id);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────

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
  const canSaveBody = selectedRequest && selectedRequest.collectionId !== "";

  const conditionPanelNode =
    conditionPanelNodeId !== null
      ? (conditionNodes.find((n) => n.id === conditionPanelNodeId) ?? null)
      : null;

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
        onNodeDoubleClick={onNodeDoubleClick}
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
            const state =
              (node.data as { state?: ChainNodeState })?.state ?? "idle";
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
          <ControlFlowToolbar
            disabled={isRunning}
            onUpsertDelayNode={onUpsertDelayNode}
            onUpsertConditionNode={onUpsertConditionNode}
            onUpdateNodePosition={onUpdateNodePosition}
            onOpenConditionPanel={setConditionPanelNodeId}
          />
          <AutoLayoutControl
            nodes={nodes}
            edges={edges}
            disabled={isRunning}
            onUpdateNodePosition={onUpdateNodePosition}
            setNodes={
              setNodes as React.Dispatch<React.SetStateAction<LayoutNode[]>>
            }
          />
        </Panel>
      </ReactFlow>

      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          requestId={contextMenu.nodeId}
          nodeType={contextMenu.nodeType}
          onClose={() => setContextMenu(null)}
          onAddAfter={onAddAfterNode}
          onRunUpTo={onRunUpTo}
          onRunFromHere={onRunFromHere}
          onDelete={onDeleteNode}
          onConfigure={(nodeId: string) => {
            setConditionPanelNodeId(nodeId);
            setContextMenu(null);
          }}
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
        envPromotions={envPromotions}
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
        edges={chainEdges.filter((e) => e.targetRequestId === selectedNodeId)}
        envPromotions={envPromotions}
        onSavePromotion={onSavePromotion}
        onRemovePromotion={onRemovePromotion}
      />

      <ConditionConfigPanel
        open={conditionPanelNodeId !== null}
        node={conditionPanelNode}
        onClose={() => setConditionPanelNodeId(null)}
        onSave={(updated) => {
          onUpsertConditionNode(updated);
        }}
        onDelete={(nodeId) => {
          onRemoveConditionNode(nodeId);
        }}
      />
    </div>
  );
}
