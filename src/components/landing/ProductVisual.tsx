"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import {
  METHOD_TEXT,
  PRODUCT_METHODS,
  PRODUCT_REQUESTS,
  statusBadgeClass,
  type MockResponse,
  type ProductMethod,
} from "./data/productVisual";

interface TabPillProps {
  method: ProductMethod;
  label: string;
  active: boolean;
  onSelect: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}

function TabPill({ method, label, active, onSelect, onKeyDown }: TabPillProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-card border border-border/60" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className={cn("font-mono font-semibold text-[10px]", METHOD_TEXT[method])}>
        {method}
      </span>
      <span
        className={cn(
          "font-mono text-[11px]",
          active ? "text-foreground" : "text-muted-foreground/70",
        )}
      >
        /{label}
      </span>
    </button>
  );
}

function ResponseBody({ response }: { response: MockResponse }) {
  return (
    <>
      {response.lines.map((line, i) => (
        <div
          key={`${line.indent}-${i}`}
          className="text-muted-foreground/50"
          style={{ paddingLeft: `${line.indent * 12}px` }}
        >
          {line.parts.map((part, j) => (
            <span key={j} className={part.className}>
              {part.text}
            </span>
          ))}
        </div>
      ))}
    </>
  );
}

export function ProductVisual() {
  const reduced = useReducedMotion();
  const [activeMethod, setActiveMethod] = useState<ProductMethod>("GET");
  const [responseIndex, setResponseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState<MockResponse | null>(
    PRODUCT_REQUESTS.GET.responses[0],
  );
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = PRODUCT_REQUESTS[activeMethod];

  const clearLoadingTimer = useCallback(() => {
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current);
      loadingTimer.current = null;
    }
  }, []);

  useEffect(() => clearLoadingTimer, [clearLoadingTimer]);

  function handleTabSelect(method: ProductMethod) {
    if (method === activeMethod) return;
    clearLoadingTimer();
    setIsLoading(false);
    setActiveMethod(method);
    setResponseIndex(0);
    setDisplayedResponse(PRODUCT_REQUESTS[method].responses[0]);
  }

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    method: ProductMethod,
  ) {
    const index = PRODUCT_METHODS.indexOf(method);
    if (index === -1) return;

    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % PRODUCT_METHODS.length;
    else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + PRODUCT_METHODS.length) % PRODUCT_METHODS.length;
    } else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = PRODUCT_METHODS.length - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    const nextMethod = PRODUCT_METHODS[nextIndex];
    handleTabSelect(nextMethod);
    event.currentTarget
      .closest('[role="tablist"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus();
  }

  function handleSend() {
    clearLoadingTimer();
    const nextIndex = (responseIndex + 1) % config.responses.length;
    const nextResponse = config.responses[nextIndex];

    if (reduced) {
      setDisplayedResponse(nextResponse);
      setResponseIndex(nextIndex);
      return;
    }

    setIsLoading(true);
    loadingTimer.current = setTimeout(() => {
      setDisplayedResponse(nextResponse);
      setIsLoading(false);
      setResponseIndex(nextIndex);
      loadingTimer.current = null;
    }, nextResponse.loadingMs);
  }

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "rounded-xl border border-border bg-card/80 shadow-2xl overflow-hidden backdrop-blur-sm transition-transform duration-300",
          !reduced && "hover:-translate-y-0.5",
        )}
      >
        <div
          className="flex items-center gap-1 border-b border-border bg-background/50 px-3 py-2"
          role="tablist"
          aria-label="Request tabs"
        >
          {PRODUCT_METHODS.map((method) => (
            <TabPill
              key={method}
              method={method}
              label={PRODUCT_REQUESTS[method].label}
              active={activeMethod === method}
              onSelect={() => handleTabSelect(method)}
              onKeyDown={(event) => handleTabKeyDown(event, method)}
            />
          ))}
          <span className="ml-auto text-muted-foreground/40 text-xs font-mono">+</span>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-sm">
            <span className={cn("font-semibold text-xs", METHOD_TEXT[config.method])}>
              {config.method}
            </span>
            <span className="text-muted-foreground/40 text-xs">│</span>
            <span className="text-muted-foreground/50 text-xs">{"{"}</span>
            <span className="text-purple-400 text-xs">{"{"}</span>
            <span className="text-purple-300 text-xs">BASE_URL</span>
            <span className="text-purple-400 text-xs">{"}"}</span>
            <span className="text-purple-400 text-xs">{"}"}</span>
            <span className="text-muted-foreground text-xs">{config.path}</span>
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading}
              className={cn(
                "ml-auto rounded px-2 py-0.5 text-[10px] font-semibold border transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
                "hover:bg-emerald-500/25 hover:scale-105 active:scale-95",
                isLoading && "opacity-60 cursor-wait",
              )}
            >
              {isLoading ? "Sending…" : "Send"}
            </button>
          </div>

          <div className="rounded-md border border-border bg-background/30 p-2.5 space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1">
              Headers
            </p>
            {config.headers.map((header) => (
              <div
                key={header.key}
                className="flex items-center gap-3 text-xs font-mono rounded px-1 -mx-1 transition-colors duration-150 hover:bg-muted/40"
              >
                <span className="text-muted-foreground/50 w-24 shrink-0 truncate">
                  {header.key}
                </span>
                <span className={header.valueClass ?? "text-foreground/70"}>{header.value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-border bg-[oklch(0.12_0.005_285)] p-3 font-mono text-xs space-y-1">
            {isLoading ? (
              <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground/60">
                {!reduced && (
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-emerald-400" />
                )}
                <span>Waiting for response…</span>
              </div>
            ) : displayedResponse ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold border",
                      statusBadgeClass(displayedResponse.status),
                    )}
                  >
                    {displayedResponse.status} {displayedResponse.statusLabel}
                  </span>
                  <span className="text-muted-foreground/40">
                    {displayedResponse.timingMs} ms · {displayedResponse.sizeKb} kB
                  </span>
                </div>
                <ResponseBody response={displayedResponse} />
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="absolute -top-3 -right-4 rounded-full border border-border bg-card px-3 py-1 text-xs font-mono shadow-xl">
        <span className="text-muted-foreground/60">env: </span>
        <span className="text-purple-400">staging</span>
      </div>

      <div className="absolute -bottom-3 -left-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono shadow-xl">
        <span className="text-emerald-400">✓ </span>
        <span className="text-emerald-400/80">data stays in your browser</span>
      </div>
    </div>
  );
}
