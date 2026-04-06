"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { KVTable } from "@/components/common/KVTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { buildUrlWithParams, syncParamsFromUrl } from "@/lib/utils";
import type { HttpMethod, KVPair, RequestModel } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type EditRequestPanelProps = {
  open: boolean;
  onClose: () => void;
  request: RequestModel;
  onSave: (updated: Partial<RequestModel>) => void;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const HTTP_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

const BODY_METHODS = new Set<HttpMethod>(["POST", "PUT", "PATCH"]);

function urlWithoutQuery(url: string): string {
  return url.split("?")[0];
}

// ── Collapsible section ───────────────────────────────────────────────────────

function CollapsibleSection({
  label,
  defaultOpen = false,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-0 border-t border-border/50 pt-4">
      <button
        type="button"
        className="flex items-center gap-1.5 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {label}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EditRequestPanel({
  open,
  onClose,
  request,
  onSave,
}: EditRequestPanelProps) {
  const [name, setName] = useState(request.name);
  const [method, setMethod] = useState<HttpMethod>(request.method);
  const [url, setUrl] = useState(request.url);

  const existingParams = request.params ?? [];
  const initialParams = syncParamsFromUrl(request.url, existingParams);
  const [pathRows, setPathRows] = useState<KVPair[]>(initialParams.pathParams);
  const [queryRows, setQueryRows] = useState<KVPair[]>(
    initialParams.queryParams,
  );
  const [headers, setHeaders] = useState<KVPair[]>(request.headers ?? []);
  const [bodyContent, setBodyContent] = useState(request.body?.content ?? "");

  function handleUrlChange(newUrl: string) {
    setUrl(newUrl);
    const { pathParams, queryParams } = syncParamsFromUrl(newUrl, [
      ...pathRows.map((r) => ({ ...r, type: "path" as const })),
      ...queryRows,
    ]);
    setPathRows(pathParams);
    setQueryRows(queryParams);
  }

  function handleQueryChange(updated: KVPair[]) {
    setQueryRows(updated);
    setUrl(buildUrlWithParams(urlWithoutQuery(url), updated));
  }

  function handlePathRowsChange(updated: KVPair[]) {
    const deleted = pathRows.filter((r) => !updated.some((u) => u.id === r.id));
    if (deleted.length > 0) {
      // Remove the deleted :param segment from the URL
      let newUrl = url;
      for (const row of deleted) {
        newUrl = newUrl.replace(new RegExp(`\\/:${row.key}(?=[/?#]|$)`), "");
      }
      setUrl(newUrl);
      const { pathParams, queryParams } = syncParamsFromUrl(newUrl, [
        ...updated.map((r) => ({ ...r, type: "path" as const })),
        ...queryRows,
      ]);
      setPathRows(pathParams);
      setQueryRows(queryParams);
    } else {
      setPathRows(updated);
    }
  }

  function handleSave() {
    const allParams: KVPair[] = [
      ...pathRows.map((r) => ({ ...r, type: "path" as const })),
      ...queryRows,
    ];
    onSave({
      name: name.trim() || request.name,
      method,
      url,
      params: allParams,
      headers,
      body: { ...request.body, content: bodyContent },
    });
    onClose();
  }

  const showBody = BODY_METHODS.has(method);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-[420px] sm:w-[460px] border-l border-border bg-card flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <SheetTitle className="text-sm font-semibold tracking-tight">
            Edit Request
          </SheetTitle>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Name
            </Label>
            <Input
              className="text-xs h-8"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Request name"
            />
          </div>

          {/* Method + URL */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Request
            </Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as HttpMethod)}
            >
              <SelectTrigger size="sm" className="w-24 text-xs font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs font-mono">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="font-mono text-xs h-8 w-full"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://api.example.com/resource/:id"
            />
          </div>

          {/* Path params */}
          {pathRows.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-border/50 pt-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pb-1">
                Path Params
              </p>
              <KVTable
                rows={pathRows}
                onChange={handlePathRowsChange}
                keyPlaceholder="Key"
                valuePlaceholder="Value"
                readOnlyKeys
                hideCheckbox
              />
            </div>
          )}

          {/* Query params */}
          <div className="flex flex-col gap-1 border-t border-border/50 pt-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pb-1">
              Query Params
            </p>
            <KVTable
              rows={queryRows}
              onChange={handleQueryChange}
              keyPlaceholder="Key"
              valuePlaceholder="Value"
            />
          </div>

          {/* Headers */}
          <CollapsibleSection label="Headers" defaultOpen={headers.length > 0}>
            <KVTable
              rows={headers}
              onChange={setHeaders}
              keyPlaceholder="Header"
              valuePlaceholder="Value"
            />
          </CollapsibleSection>

          {/* Body */}
          {showBody && (
            <CollapsibleSection label="Body" defaultOpen={Boolean(bodyContent)}>
              <Textarea
                className="font-mono text-xs min-h-[120px] resize-y"
                value={bodyContent}
                onChange={(e) => setBodyContent(e.target.value)}
                placeholder='{"key": "value"}'
              />
            </CollapsibleSection>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-5 py-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button size="sm" className="text-xs" onClick={handleSave}>
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
