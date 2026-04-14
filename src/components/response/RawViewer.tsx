"use client";

import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MAX_RESPONSE_DISPLAY_BYTES } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";

type RawViewerProps = {
  body: string;
};

export function RawViewer({ body }: RawViewerProps) {
  const bytes = new TextEncoder().encode(body).length;
  const isTruncated = bytes > MAX_RESPONSE_DISPLAY_BYTES;
  const displayBody = isTruncated
    ? body.slice(0, MAX_RESPONSE_DISPLAY_BYTES)
    : body;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(body);
      toast.success("Response copied");
    } catch {
      toast.error("Failed to copy");
    }
  }

  function handleDownload() {
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "response.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col" data-testid="response-raw-viewer">
      <div className="flex items-center justify-between border-b px-3 py-1">
        <span className="text-[11px] text-muted-foreground">
          {formatBytes(bytes)}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            title="Copy"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isTruncated && (
        <div className="bg-amber-500/10 px-3 py-1 text-[11px] text-amber-400">
          Response truncated at {formatBytes(MAX_RESPONSE_DISPLAY_BYTES)}.{" "}
          <button type="button" onClick={handleDownload} className="underline">
            Download full response
          </button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <pre
          className="p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all"
          data-testid="response-raw-body"
        >
          {displayBody}
        </pre>
      </ScrollArea>
    </div>
  );
}
