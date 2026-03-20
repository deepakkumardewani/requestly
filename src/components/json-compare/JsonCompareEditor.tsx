"use client";

import { Wand2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

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
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onFormat}
          disabled={!value.trim()}
          title="Format JSON"
        >
          <Wand2 className="h-3.5 w-3.5" />
        </Button>
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
