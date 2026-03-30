"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { generateId } from "@/lib/utils";
import type { RequestModel } from "@/types";
import type { ChainEdge } from "@/types/chain";

type TargetField = "url" | "header" | "body";

type ArrowConfigPanelProps = {
  open: boolean;
  onClose: () => void;
  sourceRequest: RequestModel | null;
  targetRequest: RequestModel | null;
  existingEdge: ChainEdge | null;
  onSave: (edge: ChainEdge) => void;
  onDelete: (edgeId: string) => void;
};

export function ArrowConfigPanel({
  open,
  onClose,
  sourceRequest,
  targetRequest,
  existingEdge,
  onSave,
  onDelete,
}: ArrowConfigPanelProps) {
  const [sourceJsonPath, setSourceJsonPath] = useState(
    existingEdge?.sourceJsonPath ?? "$.token",
  );
  const [targetField, setTargetField] = useState<TargetField>(
    existingEdge?.targetField ?? "header",
  );
  const [targetKey, setTargetKey] = useState(
    existingEdge?.targetKey ?? "Authorization",
  );

  // Reset when edge changes
  const edgeId = existingEdge?.id;
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on id change
  useState(() => {
    if (edgeId) {
      setSourceJsonPath(existingEdge?.sourceJsonPath ?? "$.token");
      setTargetField(existingEdge?.targetField ?? "header");
      setTargetKey(existingEdge?.targetKey ?? "Authorization");
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

  const targetFieldLabel: Record<TargetField, string> = {
    url: "URL Query Param name",
    header: "Header name",
    body: "Body JSONPath (e.g. $.user.id)",
  };

  const targetFieldPlaceholder: Record<TargetField, string> = {
    url: "userId",
    header: "Authorization",
    body: "$.token",
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-[380px] sm:w-[420px] border-l border-border bg-card"
      >
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="text-sm font-semibold">
            Configure Dependency
          </SheetTitle>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="font-medium text-foreground">
              {sourceRequest?.name ?? "Source"}
            </span>{" "}
            <span className="mx-1 text-muted-foreground">→</span>{" "}
            <span className="font-medium text-foreground">
              {targetRequest?.name ?? "Target"}
            </span>
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Source JSONPath */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">
              Extract from source response
            </Label>
            <p className="text-[11px] text-muted-foreground">
              JSONPath to extract a value from{" "}
              <span className="font-medium">{sourceRequest?.name}</span>'s
              response
            </p>
            <Input
              value={sourceJsonPath}
              onChange={(e) => setSourceJsonPath(e.target.value)}
              placeholder="$.token"
              className="font-mono text-xs h-8"
            />
            <p className="text-[10px] text-muted-foreground">
              e.g. <code className="text-primary">$.data.token</code> or{" "}
              <code className="text-primary">$.user.id</code>
            </p>
          </div>

          {/* Target field type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">
              Inject into target
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Where to inject the extracted value in{" "}
              <span className="font-medium">{targetRequest?.name}</span>
            </p>
            <div className="flex gap-2">
              {(["url", "header", "body"] as TargetField[]).map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => setTargetField(field)}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    targetField === field
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/50 text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  {field === "url" ? "URL Param" : field === "header" ? "Header" : "Body Path"}
                </button>
              ))}
            </div>
          </div>

          {/* Target key */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">
              {targetFieldLabel[targetField]}
            </Label>
            <Input
              value={targetKey}
              onChange={(e) => setTargetKey(e.target.value)}
              placeholder={targetFieldPlaceholder[targetField]}
              className="font-mono text-xs h-8"
            />
            {targetField === "header" && (
              <p className="text-[10px] text-muted-foreground">
                The extracted value will be set as the header value (e.g.{" "}
                <code className="text-primary">Bearer {"<extracted>"}</code> —
                include prefix in the JSONPath if needed)
              </p>
            )}
          </div>

          {/* Preview */}
          {sourceJsonPath.trim() && targetKey.trim() && (
            <div className="rounded-md border border-border/50 bg-muted/30 p-3">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                Preview
              </p>
              <p className="text-xs text-foreground font-mono leading-relaxed">
                Extract{" "}
                <span className="text-primary">{sourceJsonPath}</span> from{" "}
                {sourceRequest?.name} response
                <br />→ inject as{" "}
                {targetField === "header"
                  ? `header "${targetKey}"`
                  : targetField === "url"
                    ? `URL param "${targetKey}"`
                    : `body path "${targetKey}"`}{" "}
                in {targetRequest?.name}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="absolute bottom-6 left-6 right-6 flex gap-2">
          {existingEdge && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="flex-1"
            >
              Delete Edge
            </Button>
          )}
          <Button
            variant="outline"
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
            className="flex-1"
          >
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
