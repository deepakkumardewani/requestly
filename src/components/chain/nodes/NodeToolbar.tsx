import { Copy, Info, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChainNodeData } from "./ChainNode";

type NodeToolbarProps = {
  data: ChainNodeData;
};

export function NodeToolbar({ data }: NodeToolbarProps) {
  const { requestId, onRunNode, onClickNode, onDuplicateNode, onDeleteNode } =
    data;
  return (
    <TooltipProvider delay={400}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 hidden group-hover/node:flex items-center gap-0.5 rounded-full border border-border bg-card px-1.5 py-1 shadow-lg z-20">
        {onRunNode && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
                  aria-label="Run this request independently"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunNode(requestId);
                  }}
                />
              }
            >
              <Play className="h-3 w-3 fill-current" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="top">Run independently</TooltipContent>
          </Tooltip>
        )}
        {onClickNode && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
                  aria-label="View request details"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickNode(requestId);
                  }}
                />
              }
            >
              <Info className="h-3 w-3" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="top">View details</TooltipContent>
          </Tooltip>
        )}
        {onDuplicateNode && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
                  aria-label="Duplicate this node"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateNode(requestId);
                  }}
                />
              }
            >
              <Copy className="h-3 w-3" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="top">Duplicate</TooltipContent>
          </Tooltip>
        )}
        {onDeleteNode && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                  aria-label="Remove node from chain"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNode(requestId);
                  }}
                />
              }
            >
              <Trash2 className="h-3 w-3" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="top">Remove from chain</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
