"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { EnvAutocompleteInput } from "@/components/common/EnvAutocompleteInput";
import { generateId } from "@/lib/utils";
import type { KVPair } from "@/types";

const VALUE_INPUT_CLASS = "h-7 border-0 bg-transparent px-1 shadow-none focus-visible:ring-1";

type KVTableProps = {
  rows: KVPair[];
  onChange: (rows: KVPair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  readOnly?: boolean;
  // Keys are derived from the URL (path params) — read-only, no delete/draft row
  readOnlyKeys?: boolean;
};

export function KVTable({
  rows,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  readOnly = false,
  readOnlyKeys = false,
}: KVTableProps) {
  const [draftKey, setDraftKey] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const draftValueRef = useRef<HTMLInputElement>(null);

  function updateRow(id: string, patch: Partial<KVPair>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function deleteRow(id: string) {
    onChange(rows.filter((r) => r.id !== id));
  }

  function commitDraft() {
    if (!draftKey && !draftValue) return;
    onChange([
      ...rows,
      { id: generateId(), key: draftKey, value: draftValue, enabled: true },
    ]);
    setDraftKey("");
    setDraftValue("");
  }

  function handleDraftKeyBlur(e: React.FocusEvent<HTMLInputElement>) {
    // Don't commit yet if focus is moving to the draft value input
    if (e.relatedTarget === draftValueRef.current) return;
    commitDraft();
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-1 border-b px-2 pb-1 text-[11px] font-medium text-foreground/75">
        <span className="w-4" />
        <span>{keyPlaceholder}</span>
        <span>{valuePlaceholder}</span>
        <span className="w-6" />
      </div>

      {/* Existing rows */}
      <div className="divide-y divide-border/50">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-1 px-2 py-0.5"
          >
            {!readOnly ? (
              <Checkbox
                className="h-3.5 w-3.5"
                checked={row.enabled}
                onCheckedChange={(checked) =>
                  updateRow(row.id, { enabled: !!checked })
                }
              />
            ) : (
              <span className="h-3.5 w-3.5" />
            )}

            <Input
              className={`h-7 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-1 ${
                !row.enabled ? "opacity-40" : ""
              } ${readOnlyKeys ? "text-muted-foreground" : ""}`}
              value={row.key}
              placeholder={keyPlaceholder}
              readOnly={readOnly || readOnlyKeys}
              onChange={(e) => updateRow(row.id, { key: e.target.value })}
            />

            {readOnly ? (
              <Input
                className={`h-7 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-1 ${
                  !row.enabled ? "opacity-40" : ""
                }`}
                value={row.value}
                placeholder={valuePlaceholder}
                readOnly
              />
            ) : (
              <EnvAutocompleteInput
                className={`${VALUE_INPUT_CLASS} ${!row.enabled ? "opacity-40" : ""}`}
                value={row.value}
                placeholder={valuePlaceholder}
                onChange={(e) => updateRow(row.id, { value: e.target.value })}
              />
            )}

            {!readOnly && !readOnlyKeys ? (
              <button
                type="button"
                onClick={() => deleteRow(row.id)}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ) : (
              <span className="h-5 w-5" />
            )}
          </div>
        ))}

        {/* Draft row for adding new entries */}
        {!readOnly && !readOnlyKeys && (
          <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-1 px-2 py-0.5">
            <span className="h-3.5 w-3.5" />
            <Input
              className="h-7 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-1"
              value={draftKey}
              placeholder={keyPlaceholder}
              onChange={(e) => setDraftKey(e.target.value)}
              onBlur={handleDraftKeyBlur}
            />
            <EnvAutocompleteInput
              ref={draftValueRef}
              className={VALUE_INPUT_CLASS}
              value={draftValue}
              placeholder={valuePlaceholder}
              onChange={(e) => setDraftValue(e.target.value)}
              onBlur={commitDraft}
            />
            <span className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
