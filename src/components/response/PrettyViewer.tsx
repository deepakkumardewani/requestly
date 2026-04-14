"use client";

import dynamic from "next/dynamic";
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
  const bytes = new TextEncoder().encode(body).length;

  if (bytes > MAX_RESPONSE_DISPLAY_BYTES) {
    return <RawViewer body={body} />;
  }

  const isJson =
    contentType.includes("json") ||
    (() => {
      try {
        JSON.parse(body);
        return true;
      } catch {
        return false;
      }
    })();

  // Pretty-print JSON
  let displayBody = body;
  if (isJson) {
    try {
      displayBody = JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      displayBody = body;
    }
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
