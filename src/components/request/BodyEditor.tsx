"use client";

import dynamic from "next/dynamic";
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

const BODY_TYPES: Array<{ value: BodyType; label: string }> = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "text", label: "Text" },
  { value: "html", label: "HTML" },
  { value: "form-data", label: "Form Data" },
  { value: "urlencoded", label: "URL Encoded" },
];

export function BodyEditor({ tabId }: BodyEditorProps) {
  const { tabs, updateTabState } = useTabsStore();
  const tab = tabs.find((t) => t.tabId === tabId);
  const envVariables = useEnvVariableKeys();

  if (!tab) return null;

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

  return (
    <div className="flex h-full flex-col">
      {/* Body type selector */}
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <span className="text-xs text-muted-foreground">Body:</span>
        <Select value={body.type} onValueChange={handleTypeChange}>
          <SelectTrigger
            data-testid="body-type-selector"
            className="h-6 w-40 border-0 bg-transparent text-xs shadow-none focus:ring-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BODY_TYPES.map((t) => (
              <SelectItem
                key={t.value}
                value={t.value}
                data-testid={`body-type-${t.value}`}
                className="text-xs"
              >
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Body content */}
      <div className="flex-1 overflow-auto" data-testid="body-editor">
        {body.type === "none" && (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground">
              No body for this request
            </p>
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
            keyPlaceholder="Key"
            valuePlaceholder="Value"
          />
        )}
      </div>
    </div>
  );
}
