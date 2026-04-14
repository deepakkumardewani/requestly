"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TimingData } from "@/types";

type Props = {
  timing: TimingData;
};

type Segment = {
  label: string;
  value: number | null;
  fillClass: string;
  trackClass: string;
};

const NA_STRIPE =
  "repeating-linear-gradient(-45deg, #3f3f46 0px, #3f3f46 3px, #52525b 3px, #52525b 6px)";

function buildSegments(timing: TimingData): Segment[] {
  return [
    {
      label: "DNS",
      value: timing.dns,
      fillClass: "bg-slate-400",
      trackClass: "bg-slate-400/15",
    },
    {
      label: "TCP",
      value: timing.tcp,
      fillClass: "bg-indigo-400",
      trackClass: "bg-indigo-400/15",
    },
    {
      label: "TLS",
      value: timing.tls,
      fillClass: "bg-purple-400",
      trackClass: "bg-purple-400/15",
    },
    {
      label: "TTFB",
      value: timing.ttfb,
      fillClass: "bg-amber-400",
      trackClass: "bg-amber-400/15",
    },
    {
      label: "Download",
      value: timing.download,
      fillClass: "bg-emerald-400",
      trackClass: "bg-emerald-400/15",
    },
  ];
}

function formatMs(value: number): string {
  return `${Math.round(value * 100) / 100} ms`;
}

function formatPct(value: number, total: number): string {
  return `${Math.round((value / total) * 100)}%`;
}

export function TimingWaterfall({ timing }: Props) {
  const segments = buildSegments(timing);

  const filledTotal = segments.reduce<number>(
    (sum, s) => sum + (s.value ?? 0),
    0,
  );
  const totalForPct = filledTotal > 0 ? filledTotal : 1;

  const nullCount = segments.filter((s) => s.value === null).length;
  // Reserve 5% visual width per N/A segment so they remain visible
  const naVisualPct = nullCount > 0 ? 5 : 0;
  const filledVisualPct = 100 - naVisualPct * nullCount;

  return (
    <TooltipProvider delay={100}>
      <div
        className="flex flex-col gap-3 p-3"
        data-testid="response-timing-waterfall"
      >
        {/* Stacked overview bar */}
        <div className="flex h-5 w-full overflow-hidden rounded">
          {segments.map((seg) => {
            if (seg.value === null) {
              return (
                <Tooltip key={seg.label}>
                  <TooltipTrigger
                    className="h-full cursor-default"
                    style={{
                      width: `${naVisualPct}%`,
                      background: NA_STRIPE,
                    }}
                  />
                  <TooltipContent side="top">
                    <span className="font-medium">{seg.label}</span>
                    <span className="ml-2 text-muted-foreground">N/A</span>
                  </TooltipContent>
                </Tooltip>
              );
            }

            const widthPct = (seg.value / totalForPct) * filledVisualPct;

            return (
              <Tooltip key={seg.label}>
                <TooltipTrigger
                  className={`h-full cursor-default ${seg.fillClass}`}
                  style={{ width: `${widthPct}%` }}
                />
                <TooltipContent side="top">
                  <span className="font-medium">{seg.label}</span>
                  <span className="ml-2">{formatMs(seg.value)}</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Breakdown table — swatch / label / mini-bar / value / pct */}
        <div className="flex flex-col">
          {segments.map((seg) => {
            const pct =
              seg.value !== null ? (seg.value / totalForPct) * 100 : 0;

            return (
              <div
                key={seg.label}
                className="grid items-center gap-x-2 py-[3px] text-[11px]"
                style={{ gridTemplateColumns: "8px 52px 1fr 68px 28px" }}
                data-testid="timing-row"
              >
                {/* Swatch */}
                {seg.value !== null ? (
                  <span
                    className={`h-2 w-2 shrink-0 rounded-[2px] ${seg.fillClass}`}
                  />
                ) : (
                  <span
                    className="h-2 w-2 shrink-0 rounded-[2px]"
                    style={{ background: NA_STRIPE }}
                  />
                )}

                {/* Label */}
                <span
                  className="text-muted-foreground"
                  data-testid="timing-label"
                >
                  {seg.label}
                </span>

                {/* Proportional mini-bar */}
                <div
                  className={`h-[3px] overflow-hidden rounded-full ${seg.trackClass}`}
                >
                  {seg.value !== null && (
                    <div
                      className={`h-full rounded-full ${seg.fillClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>

                {/* Value */}
                <span
                  className="text-right font-mono text-foreground"
                  data-testid="timing-value"
                >
                  {seg.value !== null ? formatMs(seg.value) : "N/A"}
                </span>

                {/* Percentage */}
                <span className="text-right font-mono text-muted-foreground">
                  {seg.value !== null ? formatPct(seg.value, totalForPct) : "—"}
                </span>
              </div>
            );
          })}

          {/* Total row */}
          <div
            className="mt-1 grid items-center gap-x-2 border-t pt-1.5 text-[11px]"
            style={{ gridTemplateColumns: "8px 52px 1fr 68px 28px" }}
          >
            <span />
            <span className="text-muted-foreground">Total</span>
            <span />
            <span className="text-right font-mono font-medium text-foreground">
              {formatMs(timing.total)}
            </span>
            <span className="text-right font-mono text-muted-foreground">
              100%
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
