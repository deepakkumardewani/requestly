"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WsMessage } from "@/types";

type MessageLogProps = {
  messages: WsMessage[];
  onClear: () => void;
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function MessageLog({ messages, onClear }: MessageLogProps) {
  return (
    <div
      className="flex h-full min-h-0 flex-col border-t border-border"
      data-testid="message-log"
    >
      <div className="flex shrink-0 items-center justify-end border-b border-border px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onClear}
          data-testid="message-log-clear-btn"
        >
          Clear
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {messages.length === 0 ? (
          <p className="px-1 text-center text-xs text-muted-foreground">
            No messages yet
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              data-testid="ws-log-entry"
              data-direction={m.direction}
              className={cn(
                "flex flex-col gap-1 rounded-md border px-2 py-1.5 text-xs",
                m.direction === "sent"
                  ? "ml-8 border-blue-500/30 bg-blue-500/10"
                  : "mr-8 border-emerald-500/30 bg-emerald-500/10",
              )}
            >
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="font-mono">{formatTime(m.timestamp)}</span>
                <span
                  className={cn(
                    "rounded px-1 py-0.5 font-semibold uppercase",
                    m.direction === "sent"
                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                      : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  {m.direction}
                </span>
              </div>
              <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed">
                {m.data}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
