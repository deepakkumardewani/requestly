"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { KVTable } from "@/components/common/KVTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEnvVariableKeys } from "@/hooks/useEnvVariableKeys";
import { useTabsStore } from "@/stores/useTabsStore";
import type { BodyType, KVPair } from "@/types";

const CodeEditor = dynamic(() => import("./CodeEditor"), { ssr: false });

type BodyEditorProps = {
  tabId: string;
};

export function BodyEditor({ tabId }: BodyEditorProps) {
  const { tabs, updateTabState } = useTabsStore();
  const tab = tabs.find((t) => t.tabId === tabId);
  const envVariables = useEnvVariableKeys();
  const t = useTranslations("request");

  if (!tab) return null;
  if (tab.type !== "http") return null;

  const { body } = tab;

  function handleTypeChange(type: BodyType | null) {
    if (!type) return;
    updateTabState(tabId, {
      body: {
        type,
        content: body.content,
        formData:
          type === "form-data" || type === "urlencoded"
            ? (body.formData ?? [])
            : undefined,
      },
    });
  }

  function handleFormDataChange(formData: KVPair[]) {
    updateTabState(tabId, { body: { ...body, formData } });
  }

  const isRawType = ["json", "xml", "text", "html"].includes(body.type);
  const isFormType = body.type === "form-data" || body.type === "urlencoded";

  const bodyTypes: Array<{ value: BodyType; label: string }> = [
    { value: "none", label: t("body.types.none") },
    { value: "json", label: t("body.types.json") },
    { value: "xml", label: t("body.types.xml") },
    { value: "text", label: t("body.types.text") },
    { value: "html", label: t("body.types.html") },
    { value: "form-data", label: t("body.types.formData") },
    { value: "urlencoded", label: t("body.types.urlEncoded") },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <Select value={body.type} onValueChange={handleTypeChange}>
          <SelectTrigger
            data-testid="body-type-selector"
            className="h-6 w-40 border-0 bg-transparent text-xs shadow-none focus:ring-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {bodyTypes.map((bt) => (
              <SelectItem
                key={bt.value}
                value={bt.value}
                data-testid={`body-type-${bt.value}`}
                className="text-xs"
              >
                {bt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto" data-testid="body-editor">
        {body.type === "none" && (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground">{t("body.noBody")}</p>
          </div>
        )}

        {isRawType && (
          <CodeEditor
            value={body.content}
            language={body.type === "json" ? "json" : "text"}
            onChange={(value) =>
              updateTabState(tabId, { body: { ...body, content: value } })
            }
            envVariables={envVariables}
          />
        )}

        {isFormType && (
          <KVTable
            rows={body.formData ?? []}
            onChange={handleFormDataChange}
            keyPlaceholder={t("body.keyPlaceholder")}
            valuePlaceholder={t("body.valuePlaceholder")}
          />
        )}
      </div>
    </div>
  );
}
