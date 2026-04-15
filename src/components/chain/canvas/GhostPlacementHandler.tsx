"use client";

import { useReactFlow } from "@xyflow/react";
import { useEffect } from "react";
import { generateId } from "@/lib/utils";
import type {
  ConditionNodeConfig,
  DelayNodeConfig,
  DisplayNodeConfig,
} from "@/types/chain";

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

export function GhostPlacementHandler({
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
