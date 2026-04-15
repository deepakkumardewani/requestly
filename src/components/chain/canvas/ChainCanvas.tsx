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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
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
import { NodeDetailsPanel } from "../panels/NodeDetailsPanel";
import { AutoLayoutControl, type LayoutNode } from "./AutoLayoutControl";
import { BlockMenu } from "./BlockMenu";
import { DeletableEdge } from "./DeletableEdge";
import { GhostNode } from "./GhostNode";
import { GhostPlacementHandler } from "./GhostPlacementHandler";
import { NodeContextMenu } from "./NodeContextMenu";

const EditRequestPanel = lazy(() =>
  import("../panels/EditRequestPanel").then((m) => ({
    default: m.EditRequestPanel,
  })),
);
const ConditionConfigPanel = lazy(() =>
  import("../panels/ConditionConfigPanel").then((m) => ({
    default: m.ConditionConfigPanel,
  })),
);

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
        style: {
          stroke: "var(--chain-edge-branch)",
          strokeWidth: 2,
          strokeDasharray: "4 2",
        },
        data: {
          label,
          labelStyle: { fontSize: 10, fill: "var(--chain-edge-branch-label)" },
          labelBgStyle: {
            fill: "var(--chain-edge-label-bg)",
            fillOpacity: 0.92,
          },
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
        style: {
          stroke: "var(--chain-edge-fail)",
          strokeWidth: 2,
          strokeDasharray: "4 2",
        },
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
        stroke: isSuccessHandle
          ? "var(--chain-edge-success)"
          : "var(--chain-edge-default)",
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
  const { resolvedTheme } = useTheme();
  const flowColorMode = resolvedTheme === "dark" ? "dark" : "light";

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
  const [keyboardFocusNodeId, setKeyboardFocusNodeId] = useState<string | null>(
    null,
  );
  const handleClickNode = useCallback((requestId: string) => {
    setKeyboardFocusNodeId(requestId);
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
    const built = buildAllNodes();
    setNodes(
      built.map((n) => ({
        ...n,
        selected: keyboardFocusNodeId !== null && n.id === keyboardFocusNodeId,
        data: {
          ...n.data,
          isKeyboardFocused:
            keyboardFocusNodeId !== null && n.id === keyboardFocusNodeId,
        },
      })) as typeof built,
    );
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
    keyboardFocusNodeId,
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
                ? {
                    stroke: "var(--chain-edge-branch)",
                    strokeWidth: 2,
                    strokeDasharray: "4 2",
                  }
                : { stroke: "var(--chain-edge-default)", strokeWidth: 2 },
              data: {
                label,
                labelStyle: {
                  fontSize: 10,
                  fill: isCondBranch
                    ? "var(--chain-edge-branch-label)"
                    : "var(--chain-edge-neutral-label)",
                },
                labelBgStyle: {
                  fill: "var(--chain-edge-label-bg)",
                  fillOpacity: 0.92,
                },
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
                stroke: "var(--chain-edge-fail)",
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
                ? {
                    stroke: "var(--chain-edge-success)",
                    strokeWidth: 2,
                    strokeDasharray: "4 2",
                  }
                : { stroke: "var(--chain-edge-default)", strokeWidth: 2 },
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
    setKeyboardFocusNodeId(null);
  }, []);

  const onCanvasKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }
      if (pendingNodeType) return;

      const sortedIds = [...nodes]
        .sort((a, b) => {
          const dy = a.position.y - b.position.y;
          if (Math.abs(dy) > 10) return dy;
          return a.position.x - b.position.x;
        })
        .map((n) => n.id);

      if (sortedIds.length === 0) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setKeyboardFocusNodeId(null);
        setNodeDetailOpen(false);
        setSelectedNodeId(null);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const id = keyboardFocusNodeId ?? sortedIds[0];
        const node = nodes.find((n) => n.id === id);
        if (!node) return;
        if (node.type === "chainNode") {
          handleClickNode(id);
        } else if (node.type === "conditionNode") {
          setConditionPanelNodeId(id);
        }
        return;
      }

      if (
        e.key === "ArrowRight" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowUp"
      ) {
        e.preventDefault();
        const focusIdx = keyboardFocusNodeId
          ? sortedIds.indexOf(keyboardFocusNodeId)
          : -1;
        let nextIdx = focusIdx >= 0 ? focusIdx : 0;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          nextIdx = (nextIdx + 1) % sortedIds.length;
        } else {
          nextIdx = (nextIdx - 1 + sortedIds.length) % sortedIds.length;
        }
        setKeyboardFocusNodeId(sortedIds[nextIdx]);
      }
    },
    [pendingNodeType, nodes, keyboardFocusNodeId, handleClickNode],
  );

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
      role="application"
      aria-label="Request chain canvas. Use arrow keys to move between nodes, Enter to open details or configure, Escape to clear selection."
      tabIndex={0}
      className="h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      style={{ cursor: pendingNodeType ? "crosshair" : undefined }}
      onMouseMove={(e) => {
        if (pendingNodeType) setCursorPos({ x: e.clientX, y: e.clientY });
      }}
      onKeyDown={onCanvasKeyDown}
    >
      {pendingNodeType && (
        <GhostNode type={pendingNodeType} cursorPos={cursorPos} />
      )}

      <ReactFlow
        className="chain-canvas-react-flow"
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
        colorMode={flowColorMode}
      >
        <Background
          color="var(--chain-canvas-dots-color)"
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
              idle: "var(--viz-state-idle)",
              running: "var(--viz-state-running)",
              passed: "var(--viz-state-passed)",
              failed: "var(--viz-state-failed)",
              skipped: "var(--viz-state-skipped)",
            };
            return colors[state as ChainNodeState];
          }}
          className="!bg-card !border-border !rounded-lg"
          maskColor="var(--chain-minimap-mask-bg)"
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
            <Suspense fallback={null}>
              <EditRequestPanel
                open
                onClose={() => setEditRequestId(null)}
                request={editRequest}
                onSave={(updated) => {
                  onSaveRequest(editRequestId, updated);
                }}
              />
            </Suspense>
          ) : null;
        })()}

      <NodeDetailsPanel
        open={nodeDetailOpen}
        onClose={() => {
          setNodeDetailOpen(false);
          setSelectedNodeId(null);
          setKeyboardFocusNodeId(null);
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

      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  );
}
