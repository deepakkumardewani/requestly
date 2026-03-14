"use client";

import { KVTable } from "@/components/common/KVTable";
import { useTabsStore } from "@/stores/useTabsStore";
import { buildUrlWithParams } from "@/lib/utils";
import type { KVPair } from "@/types";

type ParamsEditorProps = {
  tabId: string;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b bg-muted/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

export function ParamsEditor({ tabId }: ParamsEditorProps) {
  const { tabs, updateTabState } = useTabsStore();
  const tab = tabs.find((t) => t.tabId === tabId);

  if (!tab) return null;

  const pathParams = tab.params.filter((p) => p.type === "path");
  const queryParams = tab.params.filter((p) => p.type !== "path");

  function handleQueryChange(updated: KVPair[]) {
    const newUrl = buildUrlWithParams(tab!.url.split("?")[0], updated);
    updateTabState(tabId, { params: [...pathParams, ...updated], url: newUrl });
  }

  function handlePathChange(updated: KVPair[]) {
    // Path param values don't appear in the URL bar — no URL rebuild needed
    updateTabState(tabId, { params: [...updated, ...queryParams] });
  }

  return (
    <div className="h-full overflow-auto">
      {pathParams.length > 0 && (
        <>
          <SectionLabel>Path Params</SectionLabel>
          <KVTable
            rows={pathParams}
            onChange={handlePathChange}
            keyPlaceholder="Parameter"
            valuePlaceholder="Value"
            readOnlyKeys
          />
        </>
      )}
      <SectionLabel>Query Params</SectionLabel>
      <KVTable
        rows={queryParams}
        onChange={handleQueryChange}
        keyPlaceholder="Parameter"
        valuePlaceholder="Value"
      />
    </div>
  );
}
