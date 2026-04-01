"use client";

import { Handle, Position } from "@xyflow/react";
import { CheckCircle, Circle, GitBranch, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChainNodeState, ConditionBranch } from "@/types/chain";

export type ConditionNodeData = {
  nodeId: string;
  variable: string;
  branches: ConditionBranch[];
  state: ChainNodeState;
  activeBranchId?: string;
  error?: string;
  onDeleteNode?: (nodeId: string) => void;
};

const STATE_BORDER: Record<ChainNodeState, string> = {
  idle: "border-border",
  running: "border-blue-500 animate-pulse",
  passed: "border-emerald-500",
  failed: "border-red-500",
  skipped: "border-zinc-500",
};

const STATE_BG: Record<ChainNodeState, string> = {
  idle: "bg-card",
  running: "bg-blue-950/30",
  passed: "bg-emerald-950/30",
  failed: "bg-red-950/30",
  skipped: "bg-zinc-900/30",
};

function StateIcon({ state }: { state: ChainNodeState }) {
  switch (state) {
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
    case "passed":
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "skipped":
      return <Circle className="h-4 w-4 text-zinc-500" />;
    default:
      return null;
  }
}

export function ConditionNode({ data }: { data: ConditionNodeData }) {
  const {
    nodeId,
    variable,
    branches,
    state,
    activeBranchId,
    error,
    onDeleteNode,
  } = data;

  // Distribute branch handles evenly along the right side
  const branchCount = branches.length;

  return (
    <div
      className={cn(
        "group relative min-w-[180px] rounded-lg border-2 px-3 py-2 shadow-lg transition-all",
        STATE_BORDER[state],
        STATE_BG[state],
      )}
      // Extra bottom padding so branch handle labels don't overflow
      style={{
        paddingBottom:
          branchCount > 1 ? `${(branchCount - 1) * 20 + 8}px` : undefined,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-border !bg-muted"
      />

      {/* Delete button */}
      {onDeleteNode && (
        <button
          type="button"
          className="absolute -top-2 -right-2 hidden h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteNode(nodeId);
          }}
          title="Remove from chain"
        >
          ×
        </button>
      )}

      {/* Header row */}
      <div className="flex items-center gap-1.5">
        <GitBranch className="h-3.5 w-3.5 shrink-0 text-violet-400" />
        <span className="text-xs font-semibold text-foreground truncate">
          {variable || "Condition"}
        </span>
        {state !== "idle" && (
          <div className="ml-auto shrink-0">
            <StateIcon state={state} />
          </div>
        )}
      </div>

      {/* Failed label */}
      {state === "failed" && error && (
        <p className="mt-1 text-[10px] text-red-400 leading-tight">{error}</p>
      )}

      {/* Branch handles — one per branch on the right side */}
      {branches.map((branch, i) => {
        const topPct = ((i + 1) / (branchCount + 1)) * 100;
        const isActive = activeBranchId === branch.id;
        const isElse = !branch.expression.trim();

        return (
          <div key={branch.id}>
            <Handle
              id={branch.id}
              type="source"
              position={Position.Right}
              style={{ top: `${topPct}%` }}
              className={cn(
                "!h-3 !w-3 !border-2 !bg-muted",
                isActive ? "!border-emerald-500" : "!border-border",
              )}
            />
            {/* Branch label — positioned to the left of the handle inside the node */}
            <span
              className={cn(
                "absolute right-4 text-[9px] leading-none pointer-events-none select-none truncate max-w-[120px]",
                isActive
                  ? "text-emerald-400"
                  : isElse
                    ? "text-zinc-400 italic"
                    : "text-muted-foreground",
              )}
              style={{ top: `calc(${topPct}% - 5px)` }}
            >
              {branch.label || (isElse ? "else" : branch.id)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
