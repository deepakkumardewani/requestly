"use client";

import { Handle, Position } from "@xyflow/react";
import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { METHOD_BADGE_CLASSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { HttpMethod, ResponseData } from "@/types";
import type { ChainNodeState } from "@/types/chain";

export type ChainNodeData = {
  requestId: string;
  name: string;
  method: HttpMethod;
  url: string;
  state: ChainNodeState;
  response?: ResponseData;
  extractedValues?: Record<string, string | null>;
  error?: string;
  onClickNode?: (requestId: string) => void;
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
      return <span className="h-4 w-4 text-muted-foreground text-xs">–</span>;
  }
}

export function ChainNode({ data }: { data: ChainNodeData }) {
  const { method, name, url, state, requestId, onClickNode } = data;
  const displayUrl = url.length > 100 ? `${url.slice(0, 100)}\u2026` : url;
  const hasBody = ["POST", "PUT", "PATCH", "DELETE"].includes(
    method.toUpperCase(),
  );
  const isClickable =
    hasBody || state === "passed" || state === "failed" || state === "skipped";

  return (
    <div
      className={cn(
        "relative min-w-[200px] max-w-[280px] rounded-lg border-2 p-3 shadow-lg transition-all",
        STATE_BORDER[state],
        STATE_BG[state],
        isClickable && "cursor-pointer hover:brightness-110 hover:shadow-xl",
      )}
      onClick={() => isClickable && onClickNode?.(requestId)}
    >
      {/* Incoming handle — left side */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-border !bg-muted"
      />

      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            METHOD_BADGE_CLASSES[method],
          )}
        >
          {method}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground leading-tight">
            {name}
          </p>
          {url.length > 100 ? (
            <TooltipProvider delay={400}>
              <Tooltip>
                <TooltipTrigger>
                  <p className="mt-0.5 text-[10px] text-muted-foreground font-mono break-words cursor-default text-left">
                    {displayUrl}
                  </p>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-[320px] font-mono text-[10px] break-all"
                >
                  {url}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <p className="mt-0.5 text-[10px] text-muted-foreground font-mono break-words">
              {displayUrl}
            </p>
          )}
        </div>

        <div className="shrink-0">
          <StateIcon state={state} />
        </div>
      </div>

      {/* Outgoing handle — right side */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-border !bg-muted"
      />
    </div>
  );
}
