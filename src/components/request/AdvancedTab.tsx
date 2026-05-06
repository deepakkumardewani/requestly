"use client";

import { useEffect, useState } from "react";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "@/lib/constants";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { TabState } from "@/types";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

type AdvancedTabProps = {
  tabId: string;
};

const DEFAULT_TIMEOUT_S = DEFAULT_REQUEST_TIMEOUT_MS / 1000;

export function AdvancedTab({ tabId }: AdvancedTabProps) {
  const { tabs, updateTabState } = useTabsStore();
  const globalSslVerify = useSettingsStore((s) => s.sslVerify);
  const globalFollowRedirects = useSettingsStore((s) => s.followRedirects);

  const tab = tabs.find((t) => t.tabId === tabId);

  // Draft state for the timeout field — mirrors RequestTimeoutField UX from UrlBar
  const timeoutMs = tab?.type === "http" ? tab.timeoutMs : undefined;
  const [timeoutDraft, setTimeoutDraft] = useState(() =>
    String((timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS) / 1000),
  );
  const [timeoutFocused, setTimeoutFocused] = useState(false);

  useEffect(() => {
    if (!timeoutFocused) {
      setTimeoutDraft(String((timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS) / 1000));
    }
  }, [timeoutMs, tabId, timeoutFocused]);

  if (!tab || tab.type !== "http") return null;

  const effectiveSsl =
    tab.sslVerify !== undefined ? tab.sslVerify : globalSslVerify;
  const effectiveRedirects =
    tab.followRedirects !== undefined
      ? tab.followRedirects
      : globalFollowRedirects;

  function patch(fields: Partial<TabState>) {
    updateTabState(tabId, fields);
  }

  function commitTimeout() {
    const raw = timeoutDraft.replace(/[^\d.]/g, "").trim();
    if (raw === "") {
      patch({ timeoutMs: undefined });
      setTimeoutDraft(String(DEFAULT_TIMEOUT_S));
      return;
    }
    const sec = Number.parseFloat(raw);
    if (Number.isNaN(sec) || sec < 1) {
      patch({ timeoutMs: undefined });
      setTimeoutDraft(String(DEFAULT_TIMEOUT_S));
      return;
    }
    const ms = Math.min(600_000, Math.round(sec * 1000));
    setTimeoutDraft(String(ms / 1000));
    patch({ timeoutMs: ms });
  }

  function handleSslChange(checked: boolean | "indeterminate") {
    if (checked === "indeterminate") return;
    patch({ sslVerify: checked });
  }

  function handleFollowRedirectsChange(checked: boolean | "indeterminate") {
    if (checked === "indeterminate") return;
    patch({ followRedirects: checked });
  }

  return (
    <div className="space-y-6 p-4">
      {/* Timeout */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Request Timeout</Label>
        <div className="flex items-center gap-2">
          <Input
            data-testid="request-timeout-seconds"
            inputMode="numeric"
            autoComplete="off"
            className="h-8 w-28 text-xs tabular-nums"
            value={timeoutDraft}
            onFocus={() => setTimeoutFocused(true)}
            onChange={(e) =>
              setTimeoutDraft(e.target.value.replace(/[^\d.]/g, ""))
            }
            onBlur={() => {
              setTimeoutFocused(false);
              commitTimeout();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
          <span className="text-xs text-muted-foreground">seconds</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Default: {DEFAULT_TIMEOUT_S}s. Range: 1–600s.
        </p>
      </div>

      {/* SSL Verification */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Verify SSL Certificate</Label>
        <div className="flex items-center gap-3">
          <Switch checked={effectiveSsl} onCheckedChange={handleSslChange} />
          <span className="text-xs">
            {effectiveSsl ? "Enabled" : "Disabled"}
            {tab.sslVerify === undefined && (
              <span className="ml-1 text-muted-foreground">
                (inherited from global)
              </span>
            )}
          </span>
          {tab.sslVerify !== undefined && (
            <button
              type="button"
              onClick={() => patch({ sslVerify: undefined })}
              className="text-[11px] text-muted-foreground underline hover:text-foreground"
            >
              Reset to global
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Global default: {globalSslVerify ? "Enabled" : "Disabled"}
        </p>
      </div>

      {/* Follow Redirects */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Follow Redirects</Label>
        <div className="flex items-center gap-3">
          <Switch
            checked={effectiveRedirects}
            onCheckedChange={handleFollowRedirectsChange}
          />
          <span className="text-xs">
            {effectiveRedirects ? "Enabled" : "Disabled"}
            {tab.followRedirects === undefined && (
              <span className="ml-1 text-muted-foreground">
                (inherited from global)
              </span>
            )}
          </span>
          {tab.followRedirects !== undefined && (
            <button
              type="button"
              onClick={() => patch({ followRedirects: undefined })}
              className="text-[11px] text-muted-foreground underline hover:text-foreground"
            >
              Reset to global
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Global default: {globalFollowRedirects ? "Enabled" : "Disabled"}
        </p>
      </div>
    </div>
  );
}
