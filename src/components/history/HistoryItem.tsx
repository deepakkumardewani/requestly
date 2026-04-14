"use client";

import { Trash2 } from "lucide-react";
import { MethodBadge } from "@/components/common/MethodBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getRelativeTime, truncateUrl } from "@/lib/utils";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { HistoryEntry } from "@/types";

type HistoryItemProps = {
  entry: HistoryEntry;
};

export function HistoryItem({ entry }: HistoryItemProps) {
  const { tabs, openTab, setActiveTab } = useTabsStore();
  const deleteEntry = useHistoryStore((s) => s.deleteEntry);

  function handleClick() {
    const existing = tabs.find(
      (t) => t.url === entry.url && t.method === entry.method,
    );
    if (existing) {
      setActiveTab(existing.tabId);
      return;
    }
    openTab({
      name: entry.request.name || truncateUrl(entry.url, 30),
      method: entry.method,
      url: entry.url,
      params: entry.request.params,
      headers: entry.request.headers,
      auth: entry.request.auth,
      body: entry.request.body,
      preScript: entry.request.preScript,
      postScript: entry.request.postScript,
      isDirty: false,
    });
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handleClick}
        data-testid="history-item"
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted pr-8"
      >
        <MethodBadge method={entry.method} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs" data-testid="history-item-url">
            {truncateUrl(entry.url, 40)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {getRelativeTime(entry.timestamp)}
          </p>
        </div>
        <StatusBadge
          status={entry.status}
          className="shrink-0 text-[10px]"
          data-testid="history-item-status"
        />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          deleteEntry(entry.id);
        }}
        data-testid="history-item-delete"
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 transition-all"
        title="Delete history entry"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
