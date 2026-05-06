"use client";

import { KVTable } from "@/components/common/KVTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { KVPair } from "@/types";

export function GlobalSection() {
  const globalBaseUrl = useSettingsStore((s) => s.globalBaseUrl);
  const globalHeaders = useSettingsStore((s) => s.globalHeaders);
  const setSetting = useSettingsStore((s) => s.setSetting);

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-base font-semibold">Global</h2>
      <p className="text-xs text-muted-foreground">
        Default base URL and headers apply to HTTP and GraphQL requests.
        Relative URLs are combined with the base URL. Request headers override
        global headers when the name matches (case-insensitive).
      </p>

      <div className="space-y-2 rounded-lg border p-4">
        <Label htmlFor="global-base-url">Base URL</Label>
        <Input
          id="global-base-url"
          data-testid="global-base-url-input"
          className="font-mono text-xs"
          placeholder="https://api.example.com"
          value={globalBaseUrl}
          onChange={(e) => setSetting("globalBaseUrl", e.target.value)}
        />
      </div>

      <div className="rounded-lg border p-4">
        <Label className="text-sm">Default headers</Label>
        <p className="mt-1 mb-2 text-xs text-muted-foreground">
          Merged into each outgoing request before per-request headers.
        </p>
        <KVTable
          rows={globalHeaders}
          onChange={(rows: KVPair[]) => setSetting("globalHeaders", rows)}
          keyPlaceholder="Header"
          valuePlaceholder="Value"
        />
      </div>
    </div>
  );
}
