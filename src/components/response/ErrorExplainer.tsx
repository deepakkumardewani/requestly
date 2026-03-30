"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { explainError } from "@/lib/errorExplainer";
import { useSettingsStore } from "@/stores/useSettingsStore";

type ErrorExplainerProps = {
  status: number;
  body: string;
  // Changes whenever a new response arrives — resets dismissed state
  responseKey: number;
};

export function ErrorExplainer({
  status,
  body,
  responseKey,
}: ErrorExplainerProps) {
  const { autoExpandExplainer } = useSettingsStore();

  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(autoExpandExplainer);

  // Reset when a new response comes in
  useEffect(() => {
    setDismissed(false);
    setExpanded(autoExpandExplainer);
  }, [responseKey, autoExpandExplainer]);

  const explanation = explainError(status, body);

  if (!explanation || dismissed) return null;

  return (
    <div className="shrink-0 border-b bg-amber-950/20">
      {/* Header — full row is clickable to toggle expand */}
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        <span className="flex-1 text-xs font-medium text-amber-300">
          Why did this fail?
        </span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {/* Dismiss stops propagation so it doesn't also toggle expand */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-5 w-5 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </button>

      {/* Body */}
      {expanded && (
        <div className="space-y-2.5 px-3 pb-3">
          <p className="text-xs font-semibold text-foreground">
            {explanation.title}
          </p>
          <p className="text-xs text-muted-foreground">{explanation.cause}</p>

          <ul className="space-y-1">
            {explanation.suggestions.map((suggestion) => (
              <li
                key={suggestion}
                className="flex gap-1.5 text-xs text-muted-foreground"
              >
                <span className="mt-px shrink-0 text-amber-400">•</span>
                {suggestion}
              </li>
            ))}
          </ul>

          {explanation.matchedHints.length > 0 && (
            <div className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 space-y-1">
              {explanation.matchedHints.map((hint) => (
                <p key={hint} className="text-xs text-amber-300">
                  {hint}
                </p>
              ))}
            </div>
          )}

          <a
            href={explanation.mdnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-400 underline-offset-2 hover:underline"
          >
            MDN docs for {status}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
