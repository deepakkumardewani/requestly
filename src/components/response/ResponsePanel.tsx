"use client";

import { Copy, Download, GitCompare, Send, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes, formatDuration } from "@/lib/utils";
import { useResponseStore } from "@/stores/useResponseStore";
import { ErrorExplainer } from "./ErrorExplainer";
import { HeadersViewer } from "./HeadersViewer";
import { PreviewFrame } from "./PreviewFrame";
import { TransformPlayground } from "./TransformPlayground";

const PrettyViewer = dynamic(
  () => import("./PrettyViewer").then((m) => ({ default: m.PrettyViewer })),
  { ssr: false },
);
const RawViewer = dynamic(
  () => import("./RawViewer").then((m) => ({ default: m.RawViewer })),
  { ssr: false },
);

type ResponsePanelProps = {
  tabId: string;
};

const SESSION_STORAGE_SEED_KEY = "json-compare-seed-left";

export function ResponsePanel({ tabId }: ResponsePanelProps) {
  const router = useRouter();
  const { responses, loading, errors, clearResponse } = useResponseStore();

  const response = responses[tabId] ?? null;
  const isLoading = loading[tabId] ?? false;
  const error = errors[tabId] ?? null;

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-2 p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Request failed"
        description={error.message}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearResponse(tabId)}
          >
            Dismiss
          </Button>
        }
      />
    );
  }

  if (!response) {
    return (
      <EmptyState
        icon={<Send className="h-10 w-10" />}
        title="Send a request"
        description="Configure your request above and press Send or Ctrl+Enter"
      />
    );
  }

  const contentType = response.headers["content-type"] ?? "";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(response?.body ?? "");
      toast.success("Response copied");
    } catch {
      toast.error("Failed to copy");
    }
  }

  function handleCompare() {
    sessionStorage.setItem(SESSION_STORAGE_SEED_KEY, response?.body ?? "");
    router.push("/json-compare");
  }

  function handleDownload() {
    const ext = contentType.includes("json")
      ? "json"
      : contentType.includes("html")
        ? "html"
        : "txt";
    const blob = new Blob([response?.body ?? ""], {
      type: contentType || "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `response.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Meta row */}
      <div className="flex items-center gap-3 border-b px-3 py-1.5">
        <StatusBadge status={response.status} />
        <span className="text-xs text-muted-foreground">
          {response.statusText}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDuration(response.duration)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatBytes(response.size)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCompare}
            title="Compare in JSON Compare"
          >
            <GitCompare className="h-3.5 w-3.5" />
          </Button>
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
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => clearResponse(tabId)}
            title="Clear"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Error explainer — only shown on 4xx/5xx */}
      {response.status >= 400 && (
        <ErrorExplainer
          status={response.status}
          body={response.body}
          responseKey={response.timestamp}
        />
      )}

      {/* Response tabs */}
      <Tabs
        defaultValue="pretty"
        className="flex flex-col overflow-hidden"
        style={{ flex: "1 1 0", minHeight: 0 }}
      >
        <TabsList className="h-8 shrink-0 rounded-none border-b bg-transparent px-3 justify-start gap-0">
          {["pretty", "raw", "headers", "preview"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="h-7 rounded-none border-b-2 border-transparent px-3 text-xs capitalize data-[state=active]:border-b-method-accent data-[state=active]:text-method-accent"
            >
              {tab}
              {tab === "headers" && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  ({Object.keys(response.headers).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="pretty" className="mt-0 h-full overflow-hidden">
            <PrettyViewer body={response.body} contentType={contentType} />
          </TabsContent>
          <TabsContent value="raw" className="mt-0 h-full overflow-hidden">
            <RawViewer body={response.body} />
          </TabsContent>
          <TabsContent value="headers" className="mt-0 h-full overflow-hidden">
            <HeadersViewer headers={response.headers} />
          </TabsContent>
          <TabsContent value="preview" className="mt-0 h-full overflow-hidden">
            <PreviewFrame body={response.body} contentType={contentType} />
          </TabsContent>
        </div>
      </Tabs>

      <TransformPlayground
        tabId={tabId}
        responseBody={response.body}
        responseStatus={response.status}
        responseHeaders={response.headers}
      />
    </div>
  );
}
