"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTabsStore } from "@/stores/useTabsStore";

type Shortcut = {
  keys: string[];
  label: string;
};

const SHORTCUTS: Shortcut[] = [
  { keys: ["Ctrl", "T"], label: "New tab" },
  { keys: ["Ctrl", "W"], label: "Close tab" },
  { keys: ["Ctrl", "Enter"], label: "Send request" },
  { keys: ["Ctrl", "S"], label: "Save request" },
  { keys: ["Ctrl", "K"], label: "Command palette" },
  { keys: ["Ctrl", "N"], label: "New collection" },
];

function KeyBadge({ label }: { label: string }) {
  return (
    <kbd className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {label}
    </kbd>
  );
}

export function EmptyState() {
  const openTab = useTabsStore((s) => s.openTab);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">No tabs open</p>
        <Button size="sm" onClick={() => openTab()} data-testid="new-tab-btn">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Request
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
          Keyboard Shortcuts
        </p>
        <div className="flex flex-col gap-1.5">
          {SHORTCUTS.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between gap-8"
            >
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={k} className="flex items-center gap-1">
                    {i > 0 && (
                      <span className="text-[10px] text-muted-foreground/40">
                        +
                      </span>
                    )}
                    <KeyBadge label={k} />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
