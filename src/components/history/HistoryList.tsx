"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { HistoryItem } from "./HistoryItem";
import { useHistoryStore } from "@/stores/useHistoryStore";

type HistoryListProps = {
  compact?: boolean;
};

export function HistoryList({ compact = false }: HistoryListProps) {
  const entries = useHistoryStore((s) => s.entries);
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? entries.filter(
        (e) =>
          e.url.toLowerCase().includes(filter.toLowerCase()) ||
          e.method.toLowerCase().includes(filter.toLowerCase()),
      )
    : entries;

  const displayed = compact ? filtered.slice(0, 20) : filtered;

  return (
    <div className="flex h-full flex-col">
      {!compact && (
        <div className="p-2">
          <Input
            className="h-7 text-xs"
            placeholder="Filter history..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      )}

      {displayed.length === 0 ? (
        <EmptyState
          title={filter ? "No matches" : "No history yet"}
          description={filter ? "Try a different search" : "Sent requests will appear here"}
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
