"use client";

import { X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { healthKey } from "@/lib/healthMonitor";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useUIStore } from "@/stores/useUIStore";
import { HistoryItem } from "./HistoryItem";

type HistoryListProps = {
  compact?: boolean;
};

export function HistoryList({ compact = false }: HistoryListProps) {
  const entries = useHistoryStore((s) => s.entries);
  const { historyFilter, setHistoryFilter } = useUIStore();

  const activeFilter = historyFilter ?? "";

  const filtered = activeFilter
    ? entries.filter((e) => {
        const term = activeFilter.toLowerCase();
        // Support both free-text search and normalised health key matching
        return (
          e.url.toLowerCase().includes(term) ||
          e.method.toLowerCase().includes(term) ||
          healthKey(e.method, e.url).toLowerCase().includes(term)
        );
      })
    : entries;

  const displayed = compact ? filtered.slice(0, 20) : filtered;

  return (
    <div className={`flex flex-col ${compact ? "" : "h-full"}`}>
      {!compact && (
        <div className="p-2">
          <div className="relative">
            <Input
              className="h-7 pr-6 text-xs"
              placeholder="Filter history..."
              value={activeFilter}
              onChange={(e) => setHistoryFilter(e.target.value || null)}
            />
            {activeFilter && (
              <button
                type="button"
                className="absolute inset-y-0 right-1.5 flex items-center text-muted-foreground hover:text-foreground"
                onClick={() => setHistoryFilter(null)}
                aria-label="Clear filter"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {displayed.length === 0 ? (
        <EmptyState
          title={activeFilter ? "No matches" : "No history yet"}
          description={
            activeFilter
              ? "Try a different search"
              : "Sent requests will appear here"
          }
          className="py-4"
        />
      ) : (
        <div className="space-y-0.5 px-1 py-1">
          {displayed.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
