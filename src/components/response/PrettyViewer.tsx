"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { MAX_RESPONSE_DISPLAY_BYTES } from "@/lib/constants";
import { RawViewer } from "./RawViewer";

const CodeEditor = dynamic(() => import("@/components/request/CodeEditor"), {
  ssr: false,
});

type PrettyViewerProps = {
  body: string;
  contentType?: string;
};

export function PrettyViewer({ body, contentType = "" }: PrettyViewerProps) {
  const bytes = useMemo(() => new TextEncoder().encode(body).length, [body]);

  const isJson = useMemo(() => {
    if (bytes > MAX_RESPONSE_DISPLAY_BYTES) return false;
    if (contentType.includes("json")) return true;
    try {
      JSON.parse(body);
      return true;
    } catch {
      return false;
    }
  }, [body, contentType, bytes]);

  const displayBody = useMemo(() => {
    if (bytes > MAX_RESPONSE_DISPLAY_BYTES) return body;
    if (!isJson) return body;
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }, [body, isJson, bytes]);

  if (bytes > MAX_RESPONSE_DISPLAY_BYTES) {
    return <RawViewer body={body} />;
  }

  return (
    <div className="h-full" data-testid="response-pretty-viewer">
      <CodeEditor
        value={displayBody}
        language={isJson ? "json" : "text"}
        readOnly
      />
    </div>
  );
}
