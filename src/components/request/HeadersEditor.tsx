"use client";

import { useTranslations } from "next-intl";
import { KVTable } from "@/components/common/KVTable";
import { useTabsStore } from "@/stores/useTabsStore";
import type { KVPair } from "@/types";

type HeadersEditorProps = {
  tabId: string;
};

export function HeadersEditor({ tabId }: HeadersEditorProps) {
  const { tabs, updateTabState } = useTabsStore();
  const tab = tabs.find((t) => t.tabId === tabId);
  const t = useTranslations("request");

  if (!tab) return null;

  function handleChange(headers: KVPair[]) {
    updateTabState(tabId, { headers });
  }

  return (
    <div className="h-full overflow-auto">
      <KVTable
        rows={tab.headers}
        onChange={handleChange}
        keyPlaceholder={t("headers.headerPlaceholder")}
        valuePlaceholder={t("headers.valuePlaceholder")}
      />
    </div>
  );
}
