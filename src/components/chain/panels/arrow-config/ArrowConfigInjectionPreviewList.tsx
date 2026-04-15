"use client";

import { memo } from "react";
import type { ChainInjection } from "@/types/chain";

export type InjectionPreviewRow = ChainInjection & { rowId: string };

type ArrowConfigInjectionPreviewListProps = {
  injections: InjectionPreviewRow[];
  sourceRequestName?: string;
  buildPreview: (inj: ChainInjection) => string;
  jsonPathToVarName: (path: string) => string;
};

/** Preview block listing each configured injection (extract → inject). */
function ArrowConfigInjectionPreviewListInner({
  injections,
  sourceRequestName,
  buildPreview,
  jsonPathToVarName,
}: ArrowConfigInjectionPreviewListProps) {
  if (!injections.some((inj) => inj.sourceJsonPath && inj.targetKey)) {
    return null;
  }

  return (
    <div className="rounded-md border border-border/50 bg-muted/30 px-4 py-3 flex flex-col gap-2.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        Preview
      </p>

      {injections.map((inj, idx) => {
        if (!inj.sourceJsonPath || !inj.targetKey) return null;
        const varName = jsonPathToVarName(inj.sourceJsonPath);
        const preview = buildPreview(inj);
        return (
          <div key={inj.rowId} className="flex flex-col gap-1">
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
                <span className="text-primary">{inj.sourceJsonPath}</span>
                <span className="text-muted-foreground"> from </span>
                <span className="text-foreground">
                  {sourceRequestName ?? "source"}
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
  );
}

export const ArrowConfigInjectionPreviewList = memo(
  ArrowConfigInjectionPreviewListInner,
);
