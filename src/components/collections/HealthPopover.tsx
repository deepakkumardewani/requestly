"use client";

import { ExternalLink } from "lucide-react";
import { SparklineChart } from "@/components/common/SparklineChart";
import { PopoverContent } from "@/components/ui/popover";
import type { HealthMetrics } from "@/types";

// Strips unnecessary trailing zeros: 120.00 → "120", 1.23 → "1.23"
function formatMs(ms: number): string {
  return `${Number(ms.toFixed(2))}ms`;
}

type StatusBucket = {
  count: number;
  dotColor: string;
  barColor: string;
  label: string;
};

type HealthPopoverContentProps = {
  metrics: HealthMetrics;
  recentTimes: number[];
  statusCounts: { success: number; clientError: number; serverError: number };
  onViewHistory: () => void;
};

// Renders only the popover content — caller owns <Popover> root and <PopoverTrigger>
export function HealthPopoverContent({
  metrics,
  recentTimes,
  statusCounts,
  onViewHistory,
}: HealthPopoverContentProps) {
  console.log("recentTimes", recentTimes);
  const total =
    statusCounts.success + statusCounts.clientError + statusCounts.serverError;

  const buckets: StatusBucket[] = [
    {
      count: statusCounts.success,
      dotColor: "bg-emerald-400",
      barColor: "bg-emerald-500",
      label: "2xx",
    },
    {
      count: statusCounts.clientError,
      dotColor: "bg-amber-400",
      barColor: "bg-amber-500",
      label: "4xx",
    },
    {
      count: statusCounts.serverError,
      dotColor: "bg-red-400",
      barColor: "bg-red-500",
      label: "5xx",
    },
  ];

  return (
    <PopoverContent
      className="w-60 overflow-hidden p-0"
      side="right"
      sideOffset={8}
    >
      {/* Header strip */}
      <div className="border-b bg-muted/50 px-3 py-2">
        <p className="text-[11px] font-semibold text-foreground">
          Request Health
        </p>
        <p className="text-[10px] text-muted-foreground">
          Last {metrics.entryCount} requests
        </p>
      </div>

      <div className="space-y-3 p-3">
        {/* Key metrics row */}
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: "Success", value: `${metrics.successRate}%` },
            { label: "p50", value: formatMs(metrics.p50) },
            { label: "p95", value: formatMs(metrics.p95) },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-md bg-muted/60 px-2 py-1.5 text-center"
            >
              <p className="text-[11px] font-semibold tabular-nums text-foreground">
                {value}
              </p>
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Sparkline */}
        {recentTimes.length > 1 && (
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Response time trend
            </p>
            <div className="rounded-md bg-muted/40 px-2 py-1.5">
              <SparklineChart
                values={recentTimes}
                width={196}
                height={36}
                color="var(--color-method-accent)"
              />
            </div>
          </div>
        )}

        {/* Status distribution bar */}
        {total > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Status breakdown
            </p>
            <div className="flex h-1.5 overflow-hidden rounded-full">
              {buckets.map(
                ({ count, barColor, label }) =>
                  count > 0 && (
                    <div
                      key={label}
                      className={barColor}
                      style={{ width: `${(count / total) * 100}%` }}
                    />
                  ),
              )}
            </div>
            <div className="mt-1.5 flex gap-3">
              {buckets.map(
                ({ count, dotColor, label }) =>
                  count > 0 && (
                    <span
                      key={label}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground"
                    >
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor}`}
                      />
                      <span className="font-medium text-foreground">
                        {count}
                      </span>{" "}
                      {label}
                    </span>
                  ),
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-3 py-2">
        <button
          type="button"
          onClick={onViewHistory}
          className="flex items-center gap-1 text-[11px] text-method-accent hover:underline"
        >
          View in History
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </PopoverContent>
  );
}
