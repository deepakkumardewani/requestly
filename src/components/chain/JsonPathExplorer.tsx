"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type JsonPathExplorerProps = {
  data: object;
  selectedPath?: string;
  onSelect: (path: string) => void;
};

const MAX_DEPTH = 6;
const VALUE_PREVIEW_MAX_LENGTH = 40;

function buildPath(parentPath: string, key: string | number): string {
  if (typeof key === "number") return `${parentPath}[${key}]`;
  return parentPath === "$" ? `$.${key}` : `${parentPath}.${key}`;
}

function formatPrimitivePreview(
  value: string | number | boolean | null,
): string {
  if (value === null) return "null";
  if (typeof value === "string") {
    const truncated =
      value.length > VALUE_PREVIEW_MAX_LENGTH
        ? `${value.slice(0, VALUE_PREVIEW_MAX_LENGTH)}…`
        : value;
    return `"${truncated}"`;
  }
  return String(value);
}

function getPrimitiveColor(value: string | number | boolean | null): string {
  if (value === null) return "text-muted-foreground";
  if (typeof value === "boolean") return "text-blue-400";
  if (typeof value === "number") return "text-amber-400";
  return "text-emerald-400";
}

type JsonNodeProps = {
  nodeKey: string | number;
  value: unknown;
  path: string;
  depth: number;
  selectedPath?: string;
  onSelect: (path: string) => void;
};

function JsonNode({
  nodeKey,
  value,
  path,
  depth,
  selectedPath,
  onSelect,
}: JsonNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);

  const isArray = Array.isArray(value);
  const isObject = value !== null && typeof value === "object" && !isArray;
  const isExpandable = isObject || isArray;

  const childEntries = isExpandable
    ? Object.entries(value as Record<string, unknown>)
    : [];

  const childCount = childEntries.length;
  const keyLabel = String(nodeKey);

  if (isExpandable) {
    return (
      <div>
        <button
          type="button"
          className="flex items-center gap-1 w-full text-left hover:bg-muted/40 rounded px-1 py-0.5 group"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <span className="text-muted-foreground shrink-0 w-3">
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
          <span className="text-xs font-mono text-foreground">{keyLabel}</span>
          <span className="text-xs font-mono text-muted-foreground ml-1">
            {isArray ? `[${childCount}]` : `{${childCount}}`}
          </span>
        </button>

        {expanded && depth < MAX_DEPTH && (
          <div className="ml-4 border-l border-border/40 pl-2 mt-0.5">
            {childEntries.map(([k, v]) => (
              <JsonNode
                key={k}
                nodeKey={isArray ? Number(k) : k}
                value={v}
                path={buildPath(path, isArray ? Number(k) : k)}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}

        {expanded && depth >= MAX_DEPTH && (
          <div className="ml-6 py-0.5 text-xs text-muted-foreground font-mono">
            …
          </div>
        )}
      </div>
    );
  }

  // Primitive leaf node
  const primitive = value as string | number | boolean | null;
  const isSelected = path === selectedPath;

  return (
    <button
      type="button"
      onClick={() => onSelect(path)}
      className={cn(
        "flex items-center gap-1.5 w-full text-left rounded px-1 py-0.5 group transition-colors",
        isSelected
          ? "bg-primary/15 ring-1 ring-primary/30"
          : "hover:bg-muted/40",
      )}
    >
      <span className="w-3 shrink-0" />
      <span className="text-xs font-mono text-foreground shrink-0">
        {keyLabel}:
      </span>
      <span
        className={cn(
          "text-xs font-mono truncate",
          getPrimitiveColor(primitive),
        )}
      >
        {formatPrimitivePreview(primitive)}
      </span>
      {isSelected && (
        <span className="ml-auto text-[10px] text-primary shrink-0 font-medium">
          selected
        </span>
      )}
    </button>
  );
}

export function JsonPathExplorer({
  data,
  selectedPath,
  onSelect,
}: JsonPathExplorerProps) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-1 py-2">
        Response body is empty.
      </p>
    );
  }

  return (
    <ScrollArea className="h-[280px] rounded-md border border-border/50 bg-muted/20">
      <div className="px-2 py-2 flex flex-col gap-0.5">
        {entries.map(([k, v]) => (
          <JsonNode
            key={k}
            nodeKey={k}
            value={v}
            path={buildPath("$", k)}
            depth={0}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
