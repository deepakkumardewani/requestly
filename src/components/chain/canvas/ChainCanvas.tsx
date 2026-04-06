"use client";

import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
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
import { LayoutGrid } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { computeAutoLayout } from "@/lib/chainLayout";
import { generateId } from "@/lib/utils";
import type { RequestModel } from "@/types";
import type {
  ChainAssertion,
  ChainEdge,
  ChainNodeState,
  ChainRunState,
  ConditionNodeConfig,
  DelayNodeConfig,
  DisplayNodeConfig,
  EnvPromotion,
} from "@/types/chain";
import { ChainNode, type ChainNodeData } from "../nodes/ChainNode";
import { ConditionNode, type ConditionNodeData } from "../nodes/ConditionNode";
import { DelayNode, type DelayNodeData } from "../nodes/DelayNode";
import { DisplayNode, type DisplayNodeData } from "../nodes/DisplayNode";
import { ConditionConfigPanel } from "../panels/ConditionConfigPanel";
import { EditRequestPanel } from "../panels/EditRequestPanel";
import { NodeDetailsPanel } from "../panels/NodeDetailsPanel";
import { BlockMenu } from "./BlockMenu";
import { DeletableEdge } from "./DeletableEdge";
import { NodeContextMenu } from "./NodeContextMenu";

const NODE_TYPES = {
  chainNode: ChainNode,
  delayNode: DelayNode,
  conditionNode: ConditionNode,
  displayNode: DisplayNode,
};

const EDGE_TYPES = {
  deletable: DeletableEdge,
};

// ── Node builders ────────────────────────────────────────────────────────────

function buildApiNodes(
  requests: RequestModel[],
  nodePositions: Record<string, { x: number; y: number }>,
  runState: ChainRunState,
  onClickNode: (requestId: string) => void,
  onDeleteNode: (nodeId: string) => void,
  onRunNode?: (nodeId: string) => void,
  onDuplicateNode?: (requestId: string) => void,
  onEditRequest?: (requestId: string) => void,
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
        onDuplicateNode,
        onRunNode,
        onEditRequest,
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
  onConfigureNode: (nodeId: string) => void,
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
        onConfigureNode,
      },
    };
  });
}

function buildDisplayNodes(
  displayNodes: DisplayNodeConfig[],
  nodePositions: Record<string, { x: number; y: number }>,
  runState: ChainRunState,
  edges: ChainEdge[],
  requests: RequestModel[],
  onClickNode: ((nodeId: string) => void) | undefined,
  onDeleteNode: (nodeId: string) => void,
): Node<DisplayNodeData>[] {
  return displayNodes.map((dn, idx) => {
    const nodeState = runState[dn.id];
    // Resolve the source response via inbound edge
    const inbound = edges.find((e) => e.targetRequestId === dn.id);
    const sourceReq = inbound
      ? requests.find((r) => r.id === inbound.sourceRequestId)
      : undefined;
    const sourceResponse = sourceReq
      ? runState[sourceReq.id]?.response
      : undefined;
    return {
      id: dn.id,
      type: "displayNode",
      position: nodePositions[dn.id] ?? { x: idx * 200 + 40, y: 320 },
      data: {
        nodeId: dn.id,
        config: dn,
        sourceResponse,
        state: (nodeState?.state ?? "idle") as ChainNodeState,
        error: nodeState?.error,
        onClickNode,
        onDeleteNode,
      },
    };
  });
}

function buildEdges(
  chainEdges: ChainEdge[],
  conditionNodes: ConditionNodeConfig[],
  onDeleteEdge: (id: string) => void,
  onClickEdge: (id: string) => void,
): Edge[] {
  return chainEdges.map((e) => {
    // Routing edge from condition node — purple dashed
    if (
      e.branchId &&
      conditionNodes.some((cn) => cn.id === e.sourceRequestId)
    ) {
      const condNode = conditionNodes.find((cn) => cn.id === e.sourceRequestId);
      const branch = condNode?.branches.find((b) => b.id === e.branchId);
      const label = branch?.label || e.branchId;
      return {
        id: e.id,
        source: e.sourceRequestId,
        target: e.targetRequestId,
        sourceHandle: e.branchId,
        type: "deletable",
        style: { stroke: "#7c3aed", strokeWidth: 2, strokeDasharray: "4 2" },
        data: {
          label,
          labelStyle: { fontSize: 10, fill: "#a78bfa" },
          labelBgStyle: { fill: "#1e293b", fillOpacity: 0.85 },
          onDeleteEdge,
          onClickEdge,
        },
      };
    }

    // Fail routing edge from API node — red dashed
    if (e.branchId === "fail") {
      return {
        id: e.id,
        source: e.sourceRequestId,
        target: e.targetRequestId,
        sourceHandle: "fail",
        type: "deletable",
        style: { stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "4 2" },
        data: { onDeleteEdge, onClickEdge },
      };
    }

    // Standard extraction edge (success path or legacy)
    const isSuccessHandle = e.branchId === "success";

    return {
      id: e.id,
      source: e.sourceRequestId,
      target: e.targetRequestId,
      sourceHandle: isSuccessHandle ? "success" : undefined,
      type: "deletable",
      style: {
        stroke: isSuccessHandle ? "#10b981" : "#475569",
        strokeWidth: 2,
        strokeDasharray: isSuccessHandle ? "4 2" : undefined,
      },
      data: { onDeleteEdge, onClickEdge },
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
  onDuplicateNode?: (requestId: string) => void;
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
  displayNodes: DisplayNodeConfig[];
  onUpsertDisplayNode: (node: DisplayNodeConfig) => void;
  envPromotions?: EnvPromotion[];
  onSavePromotion?: (promotion: EnvPromotion) => void;
  onRemovePromotion?: (edgeId: string) => void;
  onSaveRequest: (id: string, patch: Partial<RequestModel>) => void;
};

// ── Auto-layout control (must live inside ReactFlow context) ─────────────────

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

// ── Ghost node overlay ───────────────────────────────────────────────────────

type GhostNodeProps = {
  type: "delay" | "condition" | "display";
  cursorPos: { x: number; y: number };
};

function GhostNode({ type, cursorPos }: GhostNodeProps) {
  return (
    <div
      className="pointer-events-none fixed z-50 opacity-60"
      style={{ left: cursorPos.x + 12, top: cursorPos.y + 12 }}
    >
      {type === "delay" ? (
        <div className="flex min-w-[160px] items-center gap-2 rounded-lg border-2 border-amber-400 bg-card px-3 py-2 shadow-lg">
          <span className="text-xs text-muted-foreground">Wait</span>
          <span className="text-xs font-semibold text-foreground">1000</span>
          <span className="text-xs text-muted-foreground">ms</span>
        </div>
      ) : type === "condition" ? (
        <div className="min-w-[180px] rounded-lg border-2 border-violet-400 bg-card px-3 py-2 shadow-lg">
          <span className="text-xs font-semibold text-foreground">
            Condition
          </span>
        </div>
      ) : (
        <div className="min-w-[180px] rounded-lg border-2 border-violet-400 bg-card px-3 py-2 shadow-lg">
          <span className="text-xs font-semibold text-foreground">Display</span>
        </div>
      )}
    </div>
  );
}

// ── Ghost placement handler (needs ReactFlow context for screenToFlowPosition)

type GhostPlacementHandlerProps = {
  pendingNodeType: "delay" | "condition" | "display" | null;
  cursorPos: { x: number; y: number };
  onUpsertDelayNode: (node: DelayNodeConfig) => void;
  onUpsertConditionNode: (node: ConditionNodeConfig) => void;
  onUpsertDisplayNode: (node: DisplayNodeConfig) => void;
  onUpdateNodePosition: (nodeId: string, pos: { x: number; y: number }) => void;
  onOpenConditionPanel: (nodeId: string) => void;
  onClearPending: () => void;
};

function GhostPlacementHandler({
  pendingNodeType,
  cursorPos,
  onUpsertDelayNode,
  onUpsertConditionNode,
  onUpsertDisplayNode,
  onUpdateNodePosition,
  onOpenConditionPanel,
  onClearPending,
}: GhostPlacementHandlerProps) {
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    if (!pendingNodeType) return;

    function handlePaneClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const isPaneClick =
        target.classList.contains("react-flow__pane") ||
        target.closest(".react-flow__pane") !== null;
      if (!isPaneClick) return;

      const pos = screenToFlowPosition({ x: cursorPos.x, y: cursorPos.y });
      const id = generateId();

      if (pendingNodeType === "delay") {
        onUpsertDelayNode({ id, type: "delay", delayMs: 1000 });
        onUpdateNodePosition(id, pos);
      } else if (pendingNodeType === "display") {
        onUpsertDisplayNode({
          id,
          type: "display",
          sourceJsonPath: "",
          targetField: "header",
          targetKey: "",
        });
        onUpdateNodePosition(id, pos);
      } else {
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
      }

      onClearPending();
    }

    window.addEventListener("click", handlePaneClick);
    return () => window.removeEventListener("click", handlePaneClick);
  }, [
    pendingNodeType,
    cursorPos,
    screenToFlowPosition,
    onUpsertDelayNode,
    onUpsertConditionNode,
    onUpsertDisplayNode,
    onUpdateNodePosition,
    onOpenConditionPanel,
    onClearPending,
  ]);

  return null;
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
  onDuplicateNode,
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
  displayNodes,
  onUpsertDisplayNode,
  envPromotions,
  onSavePromotion,
  onRemovePromotion,
  onSaveRequest,
}: ChainCanvasProps) {
  const [nodeDetailOpen, setNodeDetailOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [conditionPanelNodeId, setConditionPanelNodeId] = useState<
    string | null
  >(null);

  const [pendingNodeType, setPendingNodeType] = useState<
    "delay" | "condition" | "display" | null
  >(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [editRequestId, setEditRequestId] = useState<string | null>(null);

  const handleClickNode = useCallback((requestId: string) => {
    setSelectedNodeId(requestId);
    setNodeDetailOpen(true);
  }, []);

  const handleEditRequest = useCallback((requestId: string) => {
    setEditRequestId(requestId);
  }, []);

  const handleEdgeClick = useCallback((_edgeId: string) => {
    // Edge clicks no longer open a configuration panel
  }, []);

  const handleUpdateDelay = useCallback(
    (id: string, delayMs: number) => {
      const node = delayNodes.find((n) => n.id === id);
      if (!node) return;
      onUpsertDelayNode({ ...node, delayMs });
    },
    [delayNodes, onUpsertDelayNode],
  );

  function buildAllNodes() {
    return [
      ...buildApiNodes(
        requests,
        nodePositions,
        runState,
        handleClickNode,
        onDeleteNode,
        onRunNode,
        onDuplicateNode,
        handleEditRequest,
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
        setConditionPanelNodeId,
      ),
      ...buildDisplayNodes(
        displayNodes,
        nodePositions,
        runState,
        chainEdges,
        requests,
        undefined,
        onDeleteNode,
      ),
    ];
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(buildAllNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    buildEdges(chainEdges, conditionNodes, onDeleteEdge, handleEdgeClick),
  );

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    setNodes(buildAllNodes());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    runState,
    requests,
    nodePositions,
    delayNodes,
    conditionNodes,
    displayNodes,
    chainEdges,
    handleClickNode,
    onDeleteNode,
    onDuplicateNode,
    onRunNode,
    handleUpdateDelay,
  ]);

  useEffect(() => {
    setEdges(
      buildEdges(chainEdges, conditionNodes, onDeleteEdge, handleEdgeClick),
    );
  }, [chainEdges, conditionNodes, onDeleteEdge, handleEdgeClick, setEdges]);

  // ESC cancels ghost placement
  useEffect(() => {
    if (!pendingNodeType) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPendingNodeType(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingNodeType]);

  const conditionNodeIds = new Set(conditionNodes.map((n) => n.id));
  const delayNodeIds = new Set(delayNodes.map((n) => n.id));
  const displayNodeIds = new Set(displayNodes.map((n) => n.id));

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      const isConditionSource =
        conditionNodeIds.has(connection.source) &&
        connection.sourceHandle !== null &&
        connection.sourceHandle !== undefined;
      const isDelaySource = delayNodeIds.has(connection.source);
      const isDelayTarget = delayNodeIds.has(connection.target);
      const isConditionTarget = conditionNodeIds.has(connection.target);
      const isDisplaySource = displayNodeIds.has(connection.source);
      const isDisplayTarget = displayNodeIds.has(connection.target);

      // Any connection involving a control-flow node or display node → auto routing edge
      if (
        isConditionSource ||
        isDelaySource ||
        isDelayTarget ||
        isConditionTarget ||
        isDisplaySource ||
        isDisplayTarget
      ) {
        const newEdge: ChainEdge = {
          id: generateId(),
          sourceRequestId: connection.source,
          targetRequestId: connection.target,
          injections: [
            { sourceJsonPath: "", targetField: "url", targetKey: "" },
          ],
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
        const isCondBranch = conditionNodeIds.has(connection.source);

        setEdges((eds) =>
          addEdge(
            {
              id: newEdge.id,
              source: newEdge.sourceRequestId,
              target: newEdge.targetRequestId,
              sourceHandle: newEdge.branchId,
              type: "deletable",
              style: isCondBranch
                ? { stroke: "#7c3aed", strokeWidth: 2, strokeDasharray: "4 2" }
                : { stroke: "#475569", strokeWidth: 2 },
              data: {
                label,
                labelStyle: {
                  fontSize: 10,
                  fill: isCondBranch ? "#a78bfa" : "#94a3b8",
                },
                labelBgStyle: { fill: "#1e293b", fillOpacity: 0.85 },
                onDeleteEdge,
                onClickEdge: handleEdgeClick,
              },
            },
            eds,
          ),
        );
        return;
      }

      // API fail handle → routing edge only
      if (connection.sourceHandle === "fail") {
        const newEdge: ChainEdge = {
          id: generateId(),
          sourceRequestId: connection.source,
          targetRequestId: connection.target,
          injections: [
            { sourceJsonPath: "", targetField: "url", targetKey: "" },
          ],
          branchId: "fail",
        };
        onUpsertEdge(newEdge);
        setEdges((eds) =>
          addEdge(
            {
              id: newEdge.id,
              source: newEdge.sourceRequestId,
              target: newEdge.targetRequestId,
              sourceHandle: "fail",
              type: "deletable",
              style: {
                stroke: "#ef4444",
                strokeWidth: 2,
                strokeDasharray: "4 2",
              },
              data: { onDeleteEdge, onClickEdge: handleEdgeClick },
            },
            eds,
          ),
        );
        return;
      }

      // API success handle or legacy → auto-create bare edge
      {
        const isSuccess = connection.sourceHandle === "success";
        const newEdge: ChainEdge = {
          id: generateId(),
          sourceRequestId: connection.source,
          targetRequestId: connection.target,
          injections: [],
          branchId: isSuccess ? "success" : undefined,
        };
        onUpsertEdge(newEdge);
        setEdges((eds) =>
          addEdge(
            {
              id: newEdge.id,
              source: newEdge.sourceRequestId,
              target: newEdge.targetRequestId,
              sourceHandle: newEdge.branchId,
              type: "deletable",
              style: isSuccess
                ? { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "4 2" }
                : { stroke: "#475569", strokeWidth: 2 },
              data: { onDeleteEdge, onClickEdge: handleEdgeClick },
            },
            eds,
          ),
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      conditionNodeIds,
      delayNodeIds,
      displayNodeIds,
      conditionNodes,
      onUpsertEdge,
      setEdges,
      onDeleteEdge,
    ],
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

  const selectedRequest = requests.find((r) => r.id === selectedNodeId) ?? null;
  const selectedState = selectedNodeId ? runState[selectedNodeId] : null;
  const canSaveBody = selectedRequest && selectedRequest.collectionId !== "";

  const conditionPanelNode =
    conditionPanelNodeId !== null
      ? (conditionNodes.find((n) => n.id === conditionPanelNodeId) ?? null)
      : null;

  return (
    <div
      className="h-full w-full"
      style={{ cursor: pendingNodeType ? "crosshair" : undefined }}
      onMouseMove={(e) => {
        if (pendingNodeType) setCursorPos({ x: e.clientX, y: e.clientY });
      }}
    >
      {pendingNodeType && (
        <GhostNode type={pendingNodeType} cursorPos={cursorPos} />
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
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
        <Background
          color="#62676fff"
          gap={24}
          variant={BackgroundVariant.Dots}
        />
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
          <BlockMenu
            disabled={isRunning}
            onAddApiClick={onAddApiClick}
            onEnterGhostMode={setPendingNodeType}
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

        <GhostPlacementHandler
          pendingNodeType={pendingNodeType}
          cursorPos={cursorPos}
          onUpsertDelayNode={onUpsertDelayNode}
          onUpsertConditionNode={onUpsertConditionNode}
          onUpsertDisplayNode={onUpsertDisplayNode}
          onUpdateNodePosition={onUpdateNodePosition}
          onOpenConditionPanel={setConditionPanelNodeId}
          onClearPending={() => setPendingNodeType(null)}
        />
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

      {editRequestId !== null &&
        (() => {
          const editRequest = requests.find((r) => r.id === editRequestId);
          return editRequest ? (
            <EditRequestPanel
              open
              onClose={() => setEditRequestId(null)}
              request={editRequest}
              onSave={(updated) => {
                onSaveRequest(editRequestId, updated);
              }}
            />
          ) : null;
        })()}

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
                onSaveRequest(selectedRequest.id, {
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
