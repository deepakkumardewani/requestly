"use client";

import { MethodBadge } from "@/components/common/MethodBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getRelativeTime, truncateUrl } from "@/lib/utils";
import { useTabsStore } from "@/stores/useTabsStore";
import type { HistoryEntry } from "@/types";

type HistoryItemProps = {
  entry: HistoryEntry;
};

export function HistoryItem({ entry }: HistoryItemProps) {
  const { tabs, openTab, setActiveTab } = useTabsStore();

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
    <button
      type="button"
      onClick={handleClick}
      className="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted"
    >
      <MethodBadge method={entry.method} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs">{truncateUrl(entry.url, 40)}</p>
        <p className="text-[11px] text-muted-foreground">
          {getRelativeTime(entry.timestamp)}
        </p>
      </div>
      <StatusBadge status={entry.status} className="shrink-0 text-[10px]" />
    </button>
  );
}
