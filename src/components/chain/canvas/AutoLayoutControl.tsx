"use client";

import type { Edge, Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { LayoutGrid } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { computeAutoLayout } from "@/lib/chainLayout";

export type LayoutNode = Node<{ [key: string]: unknown }>;

type AutoLayoutControlProps = {
  nodes: LayoutNode[];
  edges: Edge[];
  disabled: boolean;
  onUpdateNodePosition: (nodeId: string, pos: { x: number; y: number }) => void;
  setNodes: React.Dispatch<React.SetStateAction<LayoutNode[]>>;
};

export function AutoLayoutControl({
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
      aria-label="Auto-arrange nodes on the canvas"
    >
      <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
      Auto Layout
    </Button>
  );
}
