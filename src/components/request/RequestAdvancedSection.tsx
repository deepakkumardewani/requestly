"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTabsStore } from "@/stores/useTabsStore";

type RequestAdvancedSectionProps = {
  tabId: string;
};

export function RequestAdvancedSection({ tabId }: RequestAdvancedSectionProps) {
  const { tabs, updateTabState } = useTabsStore();
  const tab = tabs.find((t) => t.tabId === tabId);
  const [open, setOpen] = useState(false);

  if (!tab || tab.type !== "http") return null;

  const timeoutMs = tab.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const seconds = timeoutMs / 1000;

  return (
    <div className="shrink-0 border-b bg-background/80 px-3">
      <button
        type="button"
        data-testid="request-advanced-trigger"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-2 text-left text-xs font-medium hover:bg-muted/40 rounded-sm"
      >
        Advanced
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="space-y-1.5 pb-3">
          <Label className="text-xs text-muted-foreground">
            Timeout (seconds)
          </Label>
          <Input
            type="number"
            min={1}
            max={600}
            step={1}
            data-testid="request-timeout-seconds"
            className="h-8 max-w-[140px] text-xs"
            value={seconds}
            onChange={(e) => {
              const s = Number.parseFloat(e.target.value);
              if (Number.isNaN(s) || s < 1) return;
              updateTabState(tabId, {
                timeoutMs: Math.min(600_000, Math.round(s * 1000)),
              });
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
