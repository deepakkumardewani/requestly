"use client";

import { useState } from "react";
import { Send, Loader2, Copy, BookmarkPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MethodBadge } from "@/components/common/MethodBadge";
import { EnvAutocompleteInput } from "@/components/common/EnvAutocompleteInput";
import { SaveRequestModal } from "@/components/collections/SaveRequestModal";
import { ShareButton } from "./ShareButton";
import { useTabsStore } from "@/stores/useTabsStore";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useSendRequest } from "@/hooks/useSendRequest";
import { generateCurl } from "@/lib/curlGenerator";
import { parseCurl, CurlParseError } from "@/lib/curlParser";
import { HTTP_METHODS } from "@/lib/constants";
import { buildUrlWithParams, parseQueryString, parsePathParams } from "@/lib/utils";
import { generateId } from "@/lib/utils";
import type { HttpMethod } from "@/types";
import { toast } from "sonner";

type UrlBarProps = {
  tabId: string;
};

export function UrlBar({ tabId }: UrlBarProps) {
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const { tabs, updateTabState } = useTabsStore();
  const resolveVariables = useEnvironmentsStore((s) => s.resolveVariables);
  const tab = tabs.find((t) => t.tabId === tabId);
  const { send, cancel, isLoading } = useSendRequest(tabId);

  if (!tab) return null;

  function handleMethodChange(method: HttpMethod | null) {
    if (!method) return;
    updateTabState(tabId, { method });
  }

  function handleUrlChange(url: string) {
    const existingParams = tab?.params ?? [];
    const existingPathParams = existingParams.filter((p) => p.type === "path");
    const existingQueryParams = existingParams.filter((p) => p.type !== "path");

    // Preserve existing values for path params already known
    const pathParamKeys = parsePathParams(url);
    const newPathParams = pathParamKeys.map((key) => {
      const existing = existingPathParams.find((ep) => ep.key === key);
      return existing ?? { id: generateId(), key, value: "", enabled: true, type: "path" as const };
    });

    const parsedQueryParams = parseQueryString(url);
    const newQueryParams = parsedQueryParams.map((p) => ({
      id: generateId(),
      key: p.key,
      value: p.value,
      enabled: true,
      type: "query" as const,
    }));

    updateTabState(tabId, {
      url,
      params: [
        ...newPathParams,
        ...(newQueryParams.length > 0 ? newQueryParams : existingQueryParams),
      ],
    });
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text");
    if (!pasted.trimStart().toLowerCase().startsWith("curl ")) return;

    e.preventDefault();
    try {
      const parsed = parseCurl(pasted);
      updateTabState(tabId, {
        url: parsed.url,
        method: parsed.method,
        headers: parsed.headers,
        body: parsed.body,
        auth: parsed.auth,
        name: tab?.name === "New Request" ? "New Request" : tab?.name,
      });
      toast.success("cURL imported", {
        description: `${parsed.method} ${parsed.url}`,
      });
    } catch (err) {
      toast.error("Failed to parse cURL", {
        description: err instanceof CurlParseError ? err.message : "Invalid cURL command",
      });
    }
  }

  async function handleCopyCurl() {
    if (!tab) return;
    const resolve = resolveVariables;
    const resolvedTab = {
      ...tab,
      url: resolve(tab.url),
      params: tab.params.map((p) => ({ ...p, value: resolve(p.value) })),
      headers: tab.headers.map((h) => ({ ...h, key: resolve(h.key), value: resolve(h.value) })),
      body: {
        ...tab.body,
        content: tab.body.content ? resolve(tab.body.content) : tab.body.content,
        formData: tab.body.formData?.map((f) => ({ ...f, key: resolve(f.key), value: resolve(f.value) })),
      },
    };
    const curl = generateCurl(resolvedTab);
    try {
      await navigator.clipboard.writeText(curl);
      toast.success("cURL copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  return (
    <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-2">
      {/* Method Selector */}
      <Select value={tab.method} onValueChange={handleMethodChange}>
        <SelectTrigger className="h-8 w-[110px] shrink-0 border-method-accent/20 bg-method-accent/5 text-xs font-medium">
          <SelectValue>
            <MethodBadge method={tab.method} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {HTTP_METHODS.map((m) => (
            <SelectItem key={m} value={m}>
              <MethodBadge method={m} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* URL Input */}
      <EnvAutocompleteInput
        value={tab.url}
        placeholder="https://api.example.com/v1/users"
        onChange={(e) => handleUrlChange(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            send();
          }
        }}
      />

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCopyCurl}
          title="Copy as cURL"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>

        <ShareButton tabId={tabId} />

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setSaveModalOpen(true)}
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
          Save
        </Button>

        <Button
          size="sm"
          className="h-8 min-w-[80px] gap-1.5 bg-method-accent text-[#0d1117] text-xs font-semibold hover:bg-method-accent/90"
          onClick={isLoading ? cancel : send}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cancel
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Send
            </>
          )}
        </Button>
      </div>

      {saveModalOpen && (
        <SaveRequestModal
          open={saveModalOpen}
          onOpenChange={setSaveModalOpen}
          tab={tab}
        />
      )}
    </div>
  );
}
