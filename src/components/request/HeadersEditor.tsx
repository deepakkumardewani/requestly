"use client";

import { KVTable } from "@/components/common/KVTable";
import { useTabsStore } from "@/stores/useTabsStore";
import type { KVPair } from "@/types";

type HeadersEditorProps = {
  tabId: string;
};

export function HeadersEditor({ tabId }: HeadersEditorProps) {
  const { tabs, updateTabState } = useTabsStore();
  const tab = tabs.find((t) => t.tabId === tabId);

  if (!tab) return null;

  function handleChange(headers: KVPair[]) {
    updateTabState(tabId, { headers });
  }

  return (
    <div className="h-full overflow-auto">
      <KVTable
        rows={tab.headers}
        onChange={handleChange}
        keyPlaceholder="Header"
        valuePlaceholder="Value"
      />
    </div>
  );
}
