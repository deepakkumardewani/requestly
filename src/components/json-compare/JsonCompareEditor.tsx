"use client";

import { Wand2 } from "lucide-react";
import dynamic from "next/dynamic";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";

const CodeEditor = dynamic(() => import("@/components/request/CodeEditor"), {
  ssr: false,
});

type JsonCompareEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  onFormat: () => void;
};

export function JsonCompareEditor({
  label,
  value,
  onChange,
  error,
  onFormat,
}: JsonCompareEditorProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Label row */}
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <TooltipIconButton
          label="Format JSON"
          onClick={onFormat}
          disabled={!value.trim()}
        >
          <Wand2 className="h-3.5 w-3.5" />
        </TooltipIconButton>
      </div>

      {/* Editor */}
      <div
        className={`min-h-0 flex-1 overflow-hidden ${
          error ? "ring-1 ring-inset ring-destructive" : ""
        }`}
      >
        <CodeEditor
          value={value}
          language="json"
          onChange={onChange}
          placeholder='{ "paste": "your JSON here" }'
        />
      </div>

      {/* Inline error */}
      {error && (
        <div className="border-t border-destructive/30 bg-destructive/10 px-3 py-1.5">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
