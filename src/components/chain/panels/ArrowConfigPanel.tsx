"use client";

import { JSONPath } from "jsonpath-plus";
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
import type {
  ChainEdge,
  ChainInjection,
  ChainNodeState,
  DisplayNodeConfig,
  EnvPromotion,
} from "@/types/chain";
import { JsonPathExplorer } from "../dialogs/JsonPathExplorer";

type TargetField = ChainInjection["targetField"];

const DEFAULT_INJECTION: ChainInjection = {
  sourceJsonPath: "$.token",
  targetField: "header",
  targetKey: "Authorization",
};

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
  /** Set when this panel is configuring a DisplayNode instead of an edge. */
  displayNodeId?: string;
  existingDisplayNode?: DisplayNodeConfig;
  onSaveDisplayNode?: (node: DisplayNodeConfig) => void;
  onDeleteDisplayNode?: (nodeId: string) => void;
};

// Extract a display variable name from a JSONPath, e.g. "$.data.token" → "token"
function jsonPathToVarName(path: string): string {
  const parts = path.replace(/^\$\.?/, "").split(".");
  return parts[parts.length - 1] || "value";
}

/**
 * Given a URL and a param name + extracted value, try to auto-replace a matching
 * static segment (or last numeric segment) with :paramName.
 * Returns the updated URL, or the original if nothing was replaced.
 */
function autoReplaceUrlSegment(
  url: string,
  paramName: string,
  extractedValue: string | null,
): string {
  if (!paramName) return url;
  // Already has this placeholder — nothing to do
  if (url.includes(`:${paramName}`)) return url;

  // Try to match the extracted value exactly as a URL segment
  if (extractedValue) {
    const escaped = extractedValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exactPattern = new RegExp(`(/)${escaped}(/|$)`);
    if (exactPattern.test(url)) {
      return url.replace(exactPattern, `$1:${paramName}$2`);
    }
  }

  // Fallback: replace the last numeric or UUID-like segment
  const numericOrUuidPattern = /(\/)[a-f0-9-]{8,}(\/?$)|(\/)\d+(\/?$)/i;
  const match = url.match(numericOrUuidPattern);
  if (match) {
    return url.replace(numericOrUuidPattern, (_, p1, p2, p3, p4) => {
      const slash = p1 ?? p3;
      const trail = p2 ?? p4 ?? "";
      return `${slash}:${paramName}${trail}`;
    });
  }

  return url;
}

/** Resolve the actual value for a JSONPath from the response body. */
function resolveJsonPathValue(
  responseBody: string | undefined,
  jsonPath: string,
): string | null {
  if (!responseBody || !jsonPath) return null;
  try {
    const parsed = JSON.parse(responseBody);
    const result = JSONPath({ path: jsonPath, json: parsed });
    if (Array.isArray(result) && result.length > 0) return String(result[0]);
    return null;
  } catch {
    return null;
  }
}

const TARGET_FIELD_LABEL: Record<TargetField, string> = {
  url: "Query param name",
  path: "Path param name (e.g. :id)",
  header: "Header name",
  body: "Body JSONPath",
};

const TARGET_FIELD_PLACEHOLDER: Record<TargetField, string> = {
  url: "userId",
  path: "id",
  header: "Authorization",
  body: "$.userId",
};

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
  displayNodeId,
  existingDisplayNode,
  onSaveDisplayNode,
  onDeleteDisplayNode,
}: ArrowConfigPanelProps) {
  const { environments } = useEnvironmentsStore();
  const [viewerOpen, setViewerOpen] = useState(false);

  // ── Display-node mode uses a flat single-injection config ─────────────────
  const isDisplayNodeMode = Boolean(displayNodeId);

  // Initialise from existing config
  const initialInjections: ChainInjection[] = isDisplayNodeMode
    ? [
        {
          sourceJsonPath:
            existingDisplayNode?.sourceJsonPath ??
            DEFAULT_INJECTION.sourceJsonPath,
          targetField:
            existingDisplayNode?.targetField ?? DEFAULT_INJECTION.targetField,
          targetKey:
            existingDisplayNode?.targetKey ?? DEFAULT_INJECTION.targetKey,
        },
      ]
    : existingEdge?.injections?.length
      ? existingEdge.injections
      : [DEFAULT_INJECTION];

  const initialTargetUrl =
    existingDisplayNode?.targetUrl ??
    existingEdge?.targetUrl ??
    targetRequest?.url ??
    "";

  const [injections, setInjections] =
    useState<ChainInjection[]>(initialInjections);
  const [targetUrl, setTargetUrl] = useState(initialTargetUrl);
  const [activeIdx, setActiveIdx] = useState(0);

  const active = injections[activeIdx] ?? injections[0];

  // ── Parsed response ───────────────────────────────────────────────────────
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

  // ── Helpers to mutate the active injection ────────────────────────────────
  function updateActive(patch: Partial<ChainInjection>) {
    setInjections((prev) =>
      prev.map((inj, i) => (i === activeIdx ? { ...inj, ...patch } : inj)),
    );
  }

  function handleSelectJsonPath(path: string) {
    const extractedValue = resolveJsonPathValue(sourceResponse?.body, path);
    const newKey = jsonPathToVarName(path);

    if (active.targetField === "path") {
      // Auto-replace a static URL segment with :paramName
      const newUrl = autoReplaceUrlSegment(targetUrl, newKey, extractedValue);
      if (newUrl !== targetUrl) setTargetUrl(newUrl);
      updateActive({ sourceJsonPath: path, targetKey: newKey });
    } else {
      updateActive({ sourceJsonPath: path });
    }
  }

  function handleTargetFieldChange(field: TargetField) {
    // When switching to path, try to auto-replace URL segment immediately
    if (field === "path") {
      const extractedValue = resolveJsonPathValue(
        sourceResponse?.body,
        active.sourceJsonPath,
      );
      const paramName =
        active.targetKey || jsonPathToVarName(active.sourceJsonPath);
      const newUrl = autoReplaceUrlSegment(
        targetUrl,
        paramName,
        extractedValue,
      );
      if (newUrl !== targetUrl) setTargetUrl(newUrl);
    }
    updateActive({ targetField: field });
  }

  function handleTargetKeyChange(key: string) {
    updateActive({ targetKey: key });
    // If we're in path mode, also attempt auto-replace in URL
    if (active.targetField === "path" && key) {
      const extractedValue = resolveJsonPathValue(
        sourceResponse?.body,
        active.sourceJsonPath,
      );
      const newUrl = autoReplaceUrlSegment(targetUrl, key, extractedValue);
      if (newUrl !== targetUrl) setTargetUrl(newUrl);
    }
  }

  function addInjection() {
    setInjections((prev) => [
      ...prev,
      { sourceJsonPath: "$.value", targetField: "header", targetKey: "" },
    ]);
    setActiveIdx(injections.length); // focus the new one
  }

  function removeInjection(idx: number) {
    setInjections((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((prev) => Math.max(0, prev >= idx ? prev - 1 : prev));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const isValid = injections.every(
    (inj) => inj.sourceJsonPath.trim() !== "" && inj.targetKey.trim() !== "",
  );

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!isValid) return;

    const hasPathInjection = injections.some(
      (inj) => inj.targetField === "path",
    );

    if (displayNodeId) {
      const first = injections[0];
      const node: DisplayNodeConfig = {
        id: displayNodeId,
        type: "display",
        sourceJsonPath: first.sourceJsonPath.trim(),
        targetField: first.targetField,
        targetKey: first.targetKey.trim(),
        targetUrl:
          (first.targetField === "path" || first.targetField === "url") &&
          targetUrl.trim()
            ? targetUrl.trim()
            : undefined,
      };
      onSaveDisplayNode?.(node);
      onClose();
      return;
    }

    const edge: ChainEdge = {
      id: existingEdge?.id ?? generateId(),
      sourceRequestId: sourceRequest?.id ?? "",
      targetRequestId: targetRequest?.id ?? "",
      targetUrl:
        hasPathInjection && targetUrl.trim() ? targetUrl.trim() : undefined,
      injections: injections.map((inj) => ({
        sourceJsonPath: inj.sourceJsonPath.trim(),
        targetField: inj.targetField,
        targetKey: inj.targetKey.trim(),
      })),
    };
    onSave(edge);
    onClose();
  };

  const handleDelete = () => {
    if (displayNodeId) {
      onDeleteDisplayNode?.(displayNodeId);
      onClose();
      return;
    }
    if (existingEdge) {
      onDelete(existingEdge.id);
    }
    onClose();
  };

  const isGet = targetRequest?.method === "GET";
  const availableFields: TargetField[] = isGet
    ? ["url", "path", "header"]
    : ["url", "path", "header", "body"];

  if (isGet && active.targetField === "body") {
    updateActive({ targetField: "header" });
  }

  // ── Preview ───────────────────────────────────────────────────────────────
  function buildInjectionPreview(inj: ChainInjection): string {
    const varName = jsonPathToVarName(inj.sourceJsonPath);
    const rawUrl =
      inj.targetField === "path" || inj.targetField === "url"
        ? targetUrl.trim() ||
          targetRequest?.url ||
          "https://api.example.com/endpoint"
        : (targetRequest?.url ?? "https://api.example.com/endpoint");

    if (inj.targetField === "url") {
      const sep = rawUrl.includes("?") ? "&" : "?";
      return `${rawUrl}${sep}${inj.targetKey}={{${varName}}}`;
    }
    if (inj.targetField === "path") {
      const placeholder = `:${inj.targetKey}`;
      if (rawUrl.includes(placeholder)) {
        return rawUrl.replace(placeholder, `{{${varName}}}`);
      }
      return `${rawUrl.replace(/\/$/, "")}/{{${varName}}}`;
    }
    if (inj.targetField === "header") {
      return `${inj.targetKey}: {{${varName}}}`;
    }
    return `${inj.targetKey}: {{${varName}}}`;
  }

  const urlMissingPlaceholder =
    active.targetField === "path" &&
    active.targetKey &&
    targetUrl &&
    !targetUrl.includes(`:${active.targetKey}`);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-[380px] sm:w-[420px] border-l border-border bg-card flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <SheetTitle className="text-sm font-semibold tracking-tight">
            Configure Dependency
          </SheetTitle>
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
          {/* ── Injection pills (multi-injection list) ──────────── */}
          {!isDisplayNodeMode && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Injections
                </Label>
                <button
                  type="button"
                  onClick={addInjection}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  + Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {injections.map((inj, idx) => {
                  const isActive = idx === activeIdx;
                  const label = inj.sourceJsonPath
                    ? `${jsonPathToVarName(inj.sourceJsonPath)} → ${inj.targetField}:${inj.targetKey || "?"}`
                    : `Injection ${idx + 1}`;
                  return (
                    <div
                      key={`${inj.sourceJsonPath}-${inj.targetField}-${inj.targetKey}-${idx}`}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-mono cursor-pointer transition-colors ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:text-foreground"
                      }`}
                      onClick={() => setActiveIdx(idx)}
                    >
                      <span className="truncate max-w-[160px]">{label}</span>
                      {injections.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeInjection(idx);
                          }}
                          className="text-muted-foreground hover:text-destructive ml-0.5 leading-none"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                        selectedPath={active.sourceJsonPath}
                        onSelect={handleSelectJsonPath}
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
                    value={active.sourceJsonPath}
                    onChange={(e) =>
                      updateActive({ sourceJsonPath: e.target.value })
                    }
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

          {/* Connector */}
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
                  onClick={() => handleTargetFieldChange(field)}
                  className={`flex-1 min-w-[60px] rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    active.targetField === field
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
                {TARGET_FIELD_LABEL[active.targetField]}
              </Label>
              <Input
                value={active.targetKey}
                onChange={(e) => handleTargetKeyChange(e.target.value)}
                placeholder={TARGET_FIELD_PLACEHOLDER[active.targetField]}
                className="font-mono text-xs h-8"
              />
              {active.targetField === "header" && (
                <p className="text-xs text-muted-foreground">
                  Value injected verbatim — include any prefix (e.g.{" "}
                  <code className="text-primary font-mono">Bearer</code>) in the
                  extracted value if needed.
                </p>
              )}
            </div>

            {/* Editable URL template — only for path/url injection */}
            {(active.targetField === "path" ||
              active.targetField === "url") && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  {active.targetField === "path"
                    ? "URL template (add :param placeholders)"
                    : "Base URL"}
                </Label>
                <Input
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder={
                    targetRequest?.url ?? "https://api.example.com/todos/:id"
                  }
                  className={`font-mono text-xs h-8 ${urlMissingPlaceholder ? "border-amber-500/60" : ""}`}
                />
                {active.targetField === "path" && (
                  <p className="text-xs text-muted-foreground">
                    Replace static segments with{" "}
                    <code className="text-primary font-mono">:paramName</code> —
                    e.g. change <code className="font-mono">/todos/101</code> to{" "}
                    <code className="text-primary font-mono">/todos/:id</code>
                  </p>
                )}
                {urlMissingPlaceholder && (
                  <p className="text-xs text-amber-400">
                    URL doesn't contain{" "}
                    <code className="font-mono">:{active.targetKey}</code> — the
                    value will be appended instead.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Preview ── */}
          {injections.some((inj) => inj.sourceJsonPath && inj.targetKey) && (
            <div className="rounded-md border border-border/50 bg-muted/30 px-4 py-3 flex flex-col gap-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Preview
              </p>

              {injections.map((inj, idx) => {
                if (!inj.sourceJsonPath || !inj.targetKey) return null;
                const varName = jsonPathToVarName(inj.sourceJsonPath);
                const preview = buildInjectionPreview(inj);
                return (
                  <div
                    key={`${inj.sourceJsonPath}-${inj.targetField}-${inj.targetKey}-${idx}`}
                    className="flex flex-col gap-1"
                  >
                    {injections.length > 1 && (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Injection {idx + 1}
                      </span>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Extract
                      </span>
                      <p className="text-xs font-mono">
                        <span className="text-primary">
                          {inj.sourceJsonPath}
                        </span>
                        <span className="text-muted-foreground"> from </span>
                        <span className="text-foreground">
                          {sourceRequest?.name ?? "source"}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {inj.targetField === "url"
                          ? "Injected URL"
                          : inj.targetField === "path"
                            ? "Resolved URL"
                            : inj.targetField === "header"
                              ? "Request header"
                              : "Body path"}
                      </span>
                      <p className="text-xs font-mono text-foreground break-all">
                        {preview}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      <span className="font-mono text-emerald-400/80">{`{{${varName}}}`}</span>{" "}
                      replaced at runtime.
                    </p>
                    {idx < injections.length - 1 && (
                      <div className="h-px bg-border/40 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-5 py-4 flex flex-col gap-3">
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
            {(existingEdge || existingDisplayNode) && (
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
