"use client";

import { BookmarkPlus, Copy, Globe, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { EnvAutocompleteInput } from "@/components/common/EnvAutocompleteInput";
import { MethodBadge } from "@/components/common/MethodBadge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSaveRequest } from "@/hooks/useSaveRequest";
import { useSendRequest } from "@/hooks/useSendRequest";
import { HTTP_METHODS } from "@/lib/constants";
import { generateCurl } from "@/lib/curlGenerator";
import { CurlParseError, parseCurl } from "@/lib/curlParser";
import { modKey } from "@/lib/platform";
import { cn, isRelativeOrPathOnlyUrl, syncParamsFromUrl } from "@/lib/utils";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { HttpMethod, HttpTab } from "@/types";
import { ConnectButton } from "./ConnectButton";
import { ShareButton } from "./ShareButton";

const TYPE_BADGE_CLASS =
  "flex h-8 w-[110px] shrink-0 items-center justify-center rounded border border-method-accent/20 bg-method-accent/5 text-xs font-semibold text-method-accent";

type UrlBarProps = {
  tabId: string;
};

export function UrlBar({ tabId }: UrlBarProps) {
  const { save } = useSaveRequest();
  const { tabs, updateTabState } = useTabsStore();
  const resolveVariables = useEnvironmentsStore((s) => s.resolveVariables);
  const globalBaseUrl = useSettingsStore((s) => s.globalBaseUrl.trim());
  const tab = tabs.find((t) => t.tabId === tabId);
  const { send, cancel, isLoading } = useSendRequest(tabId);

  if (!tab) return null;

  if (tab.type === "graphql") {
    function handleGraphQLUrlChange(url: string) {
      updateTabState(tabId, { url });
    }

    const gqlShowBase =
      Boolean(globalBaseUrl) && isRelativeOrPathOnlyUrl(tab.url);

    return (
      <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-2">
        <span className={cn(TYPE_BADGE_CLASS, "font-mono tracking-wide")}>
          GQL
        </span>
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-md border border-input bg-background shadow-xs">
          {gqlShowBase ? (
            <span
              className="flex max-w-[min(42%,14rem)] shrink-0 items-center border-r border-border bg-muted/35 px-2 py-1.5 text-[11px] font-mono text-muted-foreground"
              title={`${globalBaseUrl} + path in the field`}
            >
              <Globe className="mr-1 h-3 w-3 shrink-0 opacity-70" />
              <span className="truncate">{globalBaseUrl}</span>
            </span>
          ) : null}
          <EnvAutocompleteInput
            value={tab.url}
            placeholder={
              gqlShowBase ? "/graphql" : "https://api.example.com/graphql"
            }
            onChange={(e) => handleGraphQLUrlChange(e.target.value)}
            data-testid="url-input"
            className="min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <TooltipProvider delay={600}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={save}
                    disabled={!!tab.requestId && !tab.isDirty}
                    data-testid="save-request-btn"
                  />
                }
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                Save
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Save <Kbd>{modKey()}+S</Kbd>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="sm"
                    className="h-8 min-w-[80px] gap-1.5 bg-method-accent text-[#0d1117] text-xs font-semibold hover:bg-method-accent/90"
                    onClick={isLoading ? cancel : send}
                    data-testid="send-request-btn"
                  />
                }
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
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Send <Kbd>{modKey()}+Enter</Kbd>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  if (tab.type === "websocket") {
    function handleWsUrlChange(url: string) {
      updateTabState(tabId, { url });
    }

    return (
      <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-2">
        <span className={TYPE_BADGE_CLASS}>WS</span>
        <EnvAutocompleteInput
          value={tab.url}
          placeholder="wss://echo.example.com"
          onChange={(e) => handleWsUrlChange(e.target.value)}
          data-testid="url-input"
        />
        <ConnectButton tabId={tabId} type="websocket" />
      </div>
    );
  }

  if (tab.type === "socketio") {
    function handleSocketIoUrlChange(url: string) {
      updateTabState(tabId, { url });
    }

    return (
      <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-2">
        <span className={TYPE_BADGE_CLASS}>SIO</span>
        <EnvAutocompleteInput
          value={tab.url}
          placeholder="http://localhost:3000"
          onChange={(e) => handleSocketIoUrlChange(e.target.value)}
          data-testid="url-input"
        />
        <ConnectButton tabId={tabId} type="socketio" />
      </div>
    );
  }

  if (tab.type !== "http") return null;

  const httpTab: HttpTab = tab;

  function handleMethodChange(method: HttpMethod | null) {
    if (!method) return;
    updateTabState(tabId, { method });
  }

  function handleUrlChange(url: string) {
    const { pathParams, queryParams } = syncParamsFromUrl(url, httpTab.params);
    updateTabState(tabId, { url, params: [...pathParams, ...queryParams] });
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
        name: httpTab.name === "New Request" ? "New Request" : httpTab.name,
      });
      toast.success("cURL imported", {
        description: `${parsed.method} ${parsed.url}`,
      });
    } catch (err) {
      toast.error("Failed to parse cURL", {
        description:
          err instanceof CurlParseError ? err.message : "Invalid cURL command",
      });
    }
  }

  async function handleCopyCurl() {
    const resolve = resolveVariables;
    const resolvedTab: HttpTab = {
      ...httpTab,
      url: resolve(httpTab.url),
      params: httpTab.params.map((p) => ({ ...p, value: resolve(p.value) })),
      headers: httpTab.headers.map((h) => ({
        ...h,
        key: resolve(h.key),
        value: resolve(h.value),
      })),
      body: {
        ...httpTab.body,
        content: httpTab.body.content
          ? resolve(httpTab.body.content)
          : httpTab.body.content,
        formData: httpTab.body.formData?.map((f) => ({
          ...f,
          key: resolve(f.key),
          value: resolve(f.value),
        })),
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

  const httpShowBase =
    Boolean(globalBaseUrl) && isRelativeOrPathOnlyUrl(httpTab.url);

  return (
    <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-2">
      {/* Method Selector */}
      <Select value={httpTab.method} onValueChange={handleMethodChange}>
        <SelectTrigger
          data-testid="method-selector"
          className="h-8 w-[110px] shrink-0 border-method-accent/20 bg-method-accent/5 text-xs font-medium"
        >
          <SelectValue>
            <MethodBadge method={httpTab.method} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {HTTP_METHODS.map((m) => (
            <SelectItem
              key={m}
              value={m}
              data-testid={`method-${m.toLowerCase()}`}
            >
              <MethodBadge method={m} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* URL + global base hint */}
      <div className="flex min-w-0 flex-1 overflow-hidden rounded-md border border-input bg-background shadow-xs">
        {httpShowBase ? (
          <span
            className="flex max-w-[min(42%,14rem)] shrink-0 items-center border-r border-border bg-muted/35 px-2 py-1.5 text-[11px] font-mono text-muted-foreground"
            title={`${globalBaseUrl} + path in the field`}
          >
            <Globe className="mr-1 h-3 w-3 shrink-0 opacity-70" />
            <span className="truncate">{globalBaseUrl}</span>
          </span>
        ) : null}
        <EnvAutocompleteInput
          value={httpTab.url}
          placeholder={
            httpShowBase ? "/posts?user=1" : "https://api.example.com/v1/users"
          }
          onChange={(e) => handleUrlChange(e.target.value)}
          onPaste={handlePaste}
          data-testid="url-input"
          className="min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="icon-sm" onClick={handleCopyCurl}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy as cURL</TooltipContent>
        </Tooltip>

        <ShareButton tabId={tabId} />

        <TooltipProvider delay={600}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={save}
                  disabled={!!httpTab.requestId && !httpTab.isDirty}
                  data-testid="save-request-btn"
                />
              }
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              Save
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Save <Kbd>{modKey()}+S</Kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="sm"
                  className="h-8 min-w-[80px] gap-1.5 bg-method-accent text-[#0d1117] text-xs font-semibold hover:bg-method-accent/90"
                  onClick={isLoading ? cancel : send}
                  data-testid="send-request-btn"
                />
              }
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
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Send <Kbd>{modKey()}+Enter</Kbd>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
