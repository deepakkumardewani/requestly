"use client";

import { AlertTriangle, Check, ChevronDown, Copy, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAnonUserId } from "@/lib/anonUser";
import { createShareLink } from "@/lib/shareLink";
import type { BodyConfig, HttpTab } from "@/types";

function hasNonEmptyBody(body: BodyConfig): boolean {
  if (body.type === "none") return false;
  if (["json", "xml", "text", "html"].includes(body.type)) {
    return body.content.trim().length > 0;
  }
  if (body.type === "form-data" || body.type === "urlencoded") {
    const fields = (body.formData ?? []).filter((f) => f.enabled && f.key);
    if (fields.length > 0) return true;
    return body.content.trim().length > 0;
  }
  return false;
}

type ShareModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: HttpTab;
};

export function ShareModal({ open, onOpenChange, tab }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const copiedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedResetRef.current !== null) {
        clearTimeout(copiedResetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setIsCreating(true);
    setCreateError(false);
    setShareUrl(null);

    void (async () => {
      const userId = getAnonUserId();
      const url = await createShareLink(tab, userId);
      if (cancelled) {
        return;
      }
      setIsCreating(false);
      if (url) {
        setShareUrl(url);
        setCreateError(false);
      } else {
        setShareUrl(null);
        setCreateError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, open]);

  async function handleCopy() {
    if (!shareUrl || isCreating) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      if (copiedResetRef.current !== null) {
        clearTimeout(copiedResetRef.current);
      }
      copiedResetRef.current = setTimeout(() => {
        copiedResetRef.current = null;
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  const enabledHeaderCount = tab.headers.filter((h) => h.enabled).length;
  const enabledParamCount = tab.params.filter((p) => p.enabled).length;
  const showSecretsWarning =
    enabledHeaderCount > 0 || hasNonEmptyBody(tab.body);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Shareable Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isCreating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              <span>Creating link…</span>
            </div>
          )}

          {createError && !isCreating && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Failed to create share link</span>
            </div>
          )}

          {/* Share URL row */}
          {shareUrl && !isCreating && (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="h-8 w-full truncate rounded-md border border-border bg-muted/40 px-2.5 text-xs font-mono text-muted-foreground focus:outline-none"
              />
              <Button
                size="sm"
                className="h-8 shrink-0 gap-1.5 text-xs"
                onClick={handleCopy}
                disabled={copied || isCreating}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          )}

          {showSecretsWarning && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Headers and body are included in this link. Remove any API keys
                or secrets before sharing.
              </span>
            </div>
          )}

          {/* Expandable "What's included" */}
          <div>
            <button
              type="button"
              onClick={() => setDetailsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>What's included</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  detailsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {detailsOpen && (
              <ul className="mt-2 space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <li>
                  <span className="text-foreground">Method:</span> {tab.method}
                </li>
                <li>
                  <span className="text-foreground">URL:</span>{" "}
                  <span className="font-mono">{tab.url || "(empty)"}</span>
                </li>
                <li>
                  <span className="text-foreground">Headers:</span>{" "}
                  {enabledHeaderCount} enabled
                </li>
                <li>
                  <span className="text-foreground">Params:</span>{" "}
                  {enabledParamCount} enabled
                </li>
                <li>
                  <span className="text-foreground">Body:</span>{" "}
                  {tab.body.type === "none" ? "none" : tab.body.type}
                </li>
                <li>
                  <span className="text-foreground">Auth:</span> {tab.auth.type}
                </li>
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
