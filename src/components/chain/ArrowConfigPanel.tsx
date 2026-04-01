"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateId } from "@/lib/utils";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import type { RequestModel, ResponseData } from "@/types";
import type { ChainEdge, ChainNodeState, EnvPromotion } from "@/types/chain";
import { JsonPathExplorer } from "./JsonPathExplorer";

type TargetField = "url" | "path" | "header" | "body";

type ArrowConfigPanelProps = {
  open: boolean;
  onClose: () => void;
  sourceRequest: RequestModel | null;
  targetRequest: RequestModel | null;
  existingEdge: ChainEdge | null;
  onSave: (edge: ChainEdge) => void;
  onDelete: (edgeId: string) => void;
  sourceRunState?: ChainNodeState;
  sourceResponse?: ResponseData;
  onRunSource?: (requestId: string) => void;
  envPromotions?: EnvPromotion[];
};

// Extract a display variable name from a JSONPath, e.g. "$.data.token" → "token"
function jsonPathToVarName(path: string): string {
  const parts = path.replace(/^\$\.?/, "").split(".");
  return parts[parts.length - 1] || "value";
}

export function ArrowConfigPanel({
  open,
  onClose,
  sourceRequest,
  targetRequest,
  existingEdge,
  onSave,
  onDelete,
  sourceRunState,
  sourceResponse,
  onRunSource,
  envPromotions,
}: ArrowConfigPanelProps) {
  const { environments } = useEnvironmentsStore();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [sourceJsonPath, setSourceJsonPath] = useState(
    existingEdge?.sourceJsonPath ?? "$.token",
  );

  const parsedResponseBody = useMemo(() => {
    if (!sourceResponse?.body) return null;
    try {
      const parsed = JSON.parse(sourceResponse.body);
      return parsed !== null && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }, [sourceResponse?.body]);

  const defaultTab = parsedResponseBody ? "explorer" : "manual";
  const [targetField, setTargetField] = useState<TargetField>(
    existingEdge?.targetField ?? "header",
  );
  const [targetKey, setTargetKey] = useState(
    existingEdge?.targetKey ?? "Authorization",
  );
  const [targetUrl, setTargetUrl] = useState(
    existingEdge?.targetUrl ?? targetRequest?.url ?? "",
  );

  // Reset when edge changes
  const edgeId = existingEdge?.id;
  useState(() => {
    if (edgeId) {
      setSourceJsonPath(existingEdge?.sourceJsonPath ?? "$.token");
      setTargetField(existingEdge?.targetField ?? "header");
      setTargetKey(existingEdge?.targetKey ?? "Authorization");
      setTargetUrl(existingEdge?.targetUrl ?? targetRequest?.url ?? "");
    }
  });

  const isValid = sourceJsonPath.trim() !== "" && targetKey.trim() !== "";

  const handleSave = () => {
    if (!isValid) return;
    const edge: ChainEdge = {
      id: existingEdge?.id ?? generateId(),
      sourceRequestId: sourceRequest?.id ?? "",
      targetRequestId: targetRequest?.id ?? "",
      sourceJsonPath: sourceJsonPath.trim(),
      targetField,
      targetKey: targetKey.trim(),
      // Only persist targetUrl for path/url injection types
      targetUrl:
        (targetField === "path" || targetField === "url") && targetUrl.trim()
          ? targetUrl.trim()
          : undefined,
    };
    onSave(edge);
    onClose();
  };

  const handleDelete = () => {
    if (existingEdge) {
      onDelete(existingEdge.id);
    }
    onClose();
  };

  const isGet = targetRequest?.method === "GET";

  // Available injection targets — hide body for GET
  const availableFields: TargetField[] = isGet
    ? ["url", "path", "header"]
    : ["url", "path", "header", "body"];

  // If current targetField was 'body' but target switched to GET, reset
  if (isGet && targetField === "body") {
    setTargetField("header");
  }

  const targetFieldLabel: Record<TargetField, string> = {
    url: "Query param name",
    path: "Path param name (e.g. :id)",
    header: "Header name",
    body: "Body JSONPath",
  };

  const targetFieldPlaceholder: Record<TargetField, string> = {
    url: "userId",
    path: "id",
    header: "Authorization",
    body: "$.userId",
  };

  // Build the injection preview — uses the editable targetUrl for path/url injection
  const varName = jsonPathToVarName(sourceJsonPath);
  function buildPreview(): { lines: Array<{ label: string; value: string }> } {
    if (!sourceJsonPath.trim() || !targetKey.trim()) return { lines: [] };
    // For path/url, use the user-editable URL; fall back to request URL, then placeholder
    const rawUrl =
      targetField === "path" || targetField === "url"
        ? targetUrl.trim() ||
          targetRequest?.url ||
          "https://api.example.com/endpoint"
        : (targetRequest?.url ?? "https://api.example.com/endpoint");

    if (targetField === "url") {
      const sep = rawUrl.includes("?") ? "&" : "?";
      const urlPreview = `${rawUrl}${sep}${targetKey}={{${varName}}}`;
      return { lines: [{ label: "URL", value: urlPreview }] };
    }
    if (targetField === "path") {
      const hasParam = new RegExp(`:${targetKey}\\b`).test(rawUrl);
      const urlPreview = hasParam
        ? rawUrl.replace(new RegExp(`:${targetKey}\\b`), `{{${varName}}}`)
        : `${rawUrl.replace(/\/$/, "")}/{{${varName}}}`;
      return { lines: [{ label: "URL", value: urlPreview }] };
    }
    if (targetField === "header") {
      return { lines: [{ label: targetKey, value: `{{${varName}}}` }] };
    }
    // body
    return { lines: [{ label: targetKey, value: `{{${varName}}}` }] };
  }
  const preview = buildPreview();

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-[380px] sm:w-[420px] border-l border-border bg-card flex flex-col p-0"
      >
        {/* Header — compact, clearly labelled */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <SheetTitle className="text-sm font-semibold tracking-tight">
            Configure Dependency
          </SheetTitle>
          {/* Source → Target pill — visually reads as a chip, not a prose sentence */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground max-w-[40%] truncate">
              {sourceRequest?.name ?? "Source"}
            </span>
            <span className="text-muted-foreground text-xs shrink-0">→</span>
            <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground max-w-[40%] truncate">
              {targetRequest?.name ?? "Target"}
            </span>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-7">
          {/* ── Extraction group ─────────────────────────── */}
          <div className="flex flex-col gap-3">
            <Label className="text-xs font-semibold text-foreground">
              Extract from source response
            </Label>
            <p className="text-xs text-muted-foreground -mt-1.5">
              Pull a value from{" "}
              <span className="font-medium text-foreground">
                {sourceRequest?.name}
              </span>
              's response
            </p>

            {!sourceResponse ? (
              /* No response yet — prompt user to run */
              <div className="rounded-md border border-border/50 bg-muted/20 px-4 py-3 flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  Run the source request first to use the visual explorer.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs self-start"
                  onClick={() => onRunSource?.(sourceRequest?.id ?? "")}
                  disabled={sourceRunState === "running" || !sourceRequest}
                >
                  {sourceRunState === "running"
                    ? "Running..."
                    : "Run Source API"}
                </Button>
              </div>
            ) : (
              <Tabs defaultValue={defaultTab}>
                <TabsList className="h-7 text-xs">
                  <TabsTrigger
                    value="explorer"
                    className="text-xs h-6 px-3"
                    disabled={!parsedResponseBody}
                  >
                    Explorer
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="text-xs h-6 px-3">
                    Manual
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="explorer"
                  className="mt-2 flex flex-col gap-2"
                >
                  {parsedResponseBody ? (
                    <>
                      <JsonPathExplorer
                        data={parsedResponseBody}
                        selectedPath={sourceJsonPath}
                        onSelect={(path) => setSourceJsonPath(path)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Click any value to select its path.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Response is not JSON — use the Manual tab to enter a
                      JSONPath.
                    </p>
                  )}
                </TabsContent>

                <TabsContent
                  value="manual"
                  className="mt-2 flex flex-col gap-2"
                >
                  <Input
                    value={sourceJsonPath}
                    onChange={(e) => setSourceJsonPath(e.target.value)}
                    placeholder="$.token"
                    className="font-mono text-xs h-8"
                  />
                  <p className="text-xs text-muted-foreground">
                    e.g.{" "}
                    <code className="text-primary font-mono">$.data.token</code>{" "}
                    or <code className="text-primary font-mono">$.user.id</code>
                  </p>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Thin connector — signals these two sections form a single flow */}
          <div className="flex items-center gap-3 -my-1">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              then inject as
            </span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          {/* ── Injection group ───────────────────────────── */}
          <div className="flex flex-col gap-3">
            <Label className="text-xs font-semibold text-foreground">
              Inject into target
            </Label>
            <p className="text-xs text-muted-foreground -mt-1.5">
              Where to place the value in{" "}
              <span className="font-medium text-foreground">
                {targetRequest?.name}
              </span>
            </p>

            {/* Segment control */}
            <div className="flex flex-wrap gap-1.5">
              {availableFields.map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => setTargetField(field)}
                  className={`flex-1 min-w-[60px] rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    targetField === field
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/50 text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  {field === "url"
                    ? "Query"
                    : field === "path"
                      ? "Path"
                      : field === "header"
                        ? "Header"
                        : "Body"}
                </button>
              ))}
            </div>

            {/* Key input */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">
                {targetFieldLabel[targetField]}
              </Label>
              <Input
                value={targetKey}
                onChange={(e) => setTargetKey(e.target.value)}
                placeholder={targetFieldPlaceholder[targetField]}
                className="font-mono text-xs h-8"
              />
              {targetField === "header" && (
                <p className="text-xs text-muted-foreground">
                  Value injected verbatim — include any prefix (e.g.{" "}
                  <code className="text-primary font-mono">Bearer</code>) in the
                  extracted value if needed.
                </p>
              )}
            </div>

            {/* Editable URL template — only for path/url injection */}
            {(targetField === "path" || targetField === "url") && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  {targetField === "path"
                    ? "URL template (add :param placeholders)"
                    : "Base URL"}
                </Label>
                <Input
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder={
                    targetRequest?.url ?? "https://api.example.com/todos/:id"
                  }
                  className="font-mono text-xs h-8"
                />
                {targetField === "path" && (
                  <p className="text-xs text-muted-foreground">
                    Replace static segments with{" "}
                    <code className="text-primary font-mono">:paramName</code> —
                    e.g. change <code className="font-mono">/todos/101</code> to{" "}
                    <code className="text-primary font-mono">/todos/:id</code>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Preview ── */}
          {preview.lines.length > 0 && (
            <div className="rounded-md border border-border/50 bg-muted/30 px-4 py-3 flex flex-col gap-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Preview
              </p>

              {/* Extraction line */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Extract
                </span>
                <p className="text-xs font-mono">
                  <span className="text-primary">{sourceJsonPath}</span>
                  <span className="text-muted-foreground"> from </span>
                  <span className="text-foreground">
                    {sourceRequest?.name ?? "source"}
                  </span>
                </p>
              </div>

              <div className="h-px bg-border/40" />

              {/* Injection lines */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {targetField === "url"
                    ? "Injected URL"
                    : targetField === "path"
                      ? "Resolved URL"
                      : targetField === "header"
                        ? "Request header"
                        : "Body path"}
                </span>
                {preview.lines.map((line) => (
                  <div
                    key={line.label}
                    className="flex items-start gap-1.5 font-mono text-xs"
                  >
                    {targetField === "url" || targetField === "path" ? (
                      <p className="text-foreground break-all">{line.value}</p>
                    ) : (
                      <>
                        <span className="text-muted-foreground shrink-0">
                          {line.label}:
                        </span>
                        <span className="text-emerald-400">{line.value}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground">
                <span className="font-mono text-emerald-400/80">{`{{${varName}}}`}</span>{" "}
                will be replaced with the extracted value at runtime.
              </p>
            </div>
          )}
        </div>

        {/* Footer — anchored at bottom, separated by border, clear action hierarchy */}
        <div className="shrink-0 border-t border-border px-5 py-4 flex flex-col gap-3">
          {/* Action to run source API */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                if (sourceRequest?.id) {
                  onRunSource?.(sourceRequest.id);
                  setViewerOpen(true);
                }
              }}
              disabled={sourceRunState === "running" || !sourceRequest}
            >
              {sourceRunState === "running" ? "Running..." : "Run Source API"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setViewerOpen(true)}
              disabled={!sourceResponse}
            >
              View Response
            </Button>
          </div>

          <div className="flex gap-2">
            {existingEdge && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="flex-1"
              >
                Delete Config
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isValid}
              className="flex-[2]"
            >
              Save
            </Button>
            {existingEdge &&
              (() => {
                const promotion = envPromotions?.find(
                  (p) => p.edgeId === existingEdge.id,
                );
                if (!promotion) return null;
                const envName =
                  environments.find((e) => e.id === promotion.envId)?.name ??
                  promotion.envId;
                return (
                  <span
                    className="inline-flex items-center self-center rounded border border-violet-500/30 bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-400"
                    title={`Extracted value will be written to ${promotion.envVarName} in ${envName}`}
                  >
                    → ENV
                  </span>
                );
              })()}
          </div>
        </div>
      </SheetContent>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0 bg-muted/20">
            <DialogTitle className="text-base">
              Response: {sourceRequest?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-card p-5 font-mono text-xs">
            {sourceRunState === "running" ? (
              <div className="text-muted-foreground flex items-center gap-2 animate-pulse">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Running request...
              </div>
            ) : sourceResponse ? (
              <pre className="text-foreground whitespace-pre-wrap">
                {(() => {
                  try {
                    return JSON.stringify(
                      JSON.parse(sourceResponse.body),
                      null,
                      2,
                    );
                  } catch {
                    return sourceResponse.body;
                  }
                })()}
              </pre>
            ) : (
              <div className="text-muted-foreground">
                No response yet. Run the API first.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
