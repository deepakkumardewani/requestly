"use client";

import { X } from "lucide-react";
import { MethodBadge } from "@/components/common/MethodBadge";
import { cn } from "@/lib/utils";
import type { TabState } from "@/types";

type TabProps = {
  tab: TabState;
  isActive: boolean;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
};

export function Tab({ tab, isActive, onSelect, onClose }: TabProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex h-9 max-w-[200px] min-w-[100px] shrink-0 items-center gap-1.5 border-r border-border px-3 text-xs transition-colors",
        isActive
          ? "bg-background text-foreground"
          : "bg-sidebar text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <MethodBadge method={tab.method} />
      <span className="flex-1 truncate text-left">
        {tab.name || "New Request"}
      </span>
      {tab.isDirty && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
      )}
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded transition-opacity",
          isActive
            ? "opacity-60 hover:opacity-100"
            : "opacity-0 group-hover:opacity-60 hover:!opacity-100",
        )}
        aria-label={`Close ${tab.name || "New Request"} tab`}
      >
        <X className="h-3 w-3" />
      </button>
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-method-accent" />
      )}
    </button>
  );
}
