"use client";

import { JSONPath } from "jsonpath-plus";
import { Link2, Play } from "lucide-react";
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  useId,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ResponseData } from "@/types";
import type { ChainNodeState } from "@/types/chain";
import { JsonPathExplorer } from "./JsonPathExplorer";

type ValuePickerPopoverProps = {
  children: React.ReactNode;
  sourceResponse?: ResponseData;
  sourceRunState?: ChainNodeState;
  selectedPath?: string;
  onSelect: (path: string, resolvedValue: string) => void;
  onRunSource?: () => void;
};

function resolvePathFromParsed(parsed: unknown, path: string): string {
  if (parsed === null || typeof parsed !== "object" || !path || !path.trim()) {
    return "";
  }
  try {
    const result = JSONPath({ path, json: parsed });
    if (Array.isArray(result) && result.length > 0) return String(result[0]);
    return "";
  } catch {
    return "";
  }
}

export function ValuePickerPopover({
  children,
  sourceResponse,
  sourceRunState,
  selectedPath,
  onSelect,
  onRunSource,
}: ValuePickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const popupId = useId();

  const parsedBody = useMemo(() => {
    if (!sourceResponse?.body) return null;
    try {
      const parsed = JSON.parse(sourceResponse.body);
      return parsed !== null && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }, [sourceResponse?.body]);

  function handleSelect(path: string) {
    const value = parsedBody ? resolvePathFromParsed(parsedBody, path) : "";
    onSelect(path, value);
  }

  if (!isValidElement(children)) {
    return null;
  }

  const trigger = cloneElement(
    children as ReactElement<{
      "aria-expanded"?: boolean;
      "aria-haspopup"?: "dialog";
      "aria-controls"?: string;
    }>,
    {
      "aria-expanded": open,
      "aria-haspopup": "dialog",
      "aria-controls": popupId,
    },
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        id={popupId}
        side="left"
        sideOffset={8}
        className="w-80 p-0"
      >
        <div className="flex flex-col gap-0">
          <div className="px-3 py-2 border-b border-border/50">
            <p className="text-xs font-semibold text-foreground">
              Pick from source response
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Click a leaf value to select it
            </p>
          </div>

          {!sourceResponse ? (
            <div className="px-3 py-4 flex flex-col gap-2.5">
              <p className="text-xs text-muted-foreground">
                Run the source node first to pick a value.
              </p>
              {onRunSource && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs self-start gap-1.5"
                  onClick={onRunSource}
                  disabled={sourceRunState === "running"}
                >
                  <Play className="h-3 w-3" />
                  {sourceRunState === "running" ? "Running…" : "Run Source"}
                </Button>
              )}
            </div>
          ) : !parsedBody ? (
            <div className="px-3 py-4">
              <p className="text-xs text-muted-foreground">
                Response is not JSON — enter a JSONPath manually.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-72">
              <div className="px-2 py-2">
                <JsonPathExplorer
                  data={parsedBody}
                  selectedPath={selectedPath}
                  onSelect={handleSelect}
                />
              </div>
            </ScrollArea>
          )}

          {selectedPath && (
            <div className="px-3 py-2 border-t border-border/50 flex items-center gap-1.5">
              <Link2 className="h-3 w-3 text-teal-400 shrink-0" />
              <span className="text-[10px] font-mono text-teal-400 truncate">
                {selectedPath}
              </span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
