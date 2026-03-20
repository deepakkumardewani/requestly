import type { DiffStats } from "@/lib/jsonDiff";

type DiffStatsBarProps = {
  stats: DiffStats;
};

export function DiffStatsBar({ stats }: DiffStatsBarProps) {
  const total = stats.added + stats.removed + stats.changed;
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3 border-b bg-muted/30 px-3 py-1.5">
      {stats.added > 0 && (
        <span className="flex items-center gap-1 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {stats.added} added
        </span>
      )}
      {stats.removed > 0 && (
        <span className="flex items-center gap-1 text-xs text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          {stats.removed} removed
        </span>
      )}
      {stats.changed > 0 && (
        <span className="flex items-center gap-1 text-xs text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          {stats.changed} changed
        </span>
      )}
    </div>
  );
}
