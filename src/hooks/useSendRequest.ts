"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { runGraphQLRequest, runRequest } from "@/lib/requestRunner";
import { runPostScript, runPreScript } from "@/lib/scriptRunner";
import { buildFinalUrl, generateId } from "@/lib/utils";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useResponseStore } from "@/stores/useResponseStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { KVPair, RequestError } from "@/types";

export function useSendRequest(tabId: string) {
  const abortRef = useRef<AbortController | null>(null);

  const { tabs } = useTabsStore();
  const { resolveVariables, getVariable, setVariable } = useEnvironmentsStore();
  const { setLoading, setResponse, setError, setScriptLogs, loading } =
    useResponseStore();
  const { addEntry } = useHistoryStore();
  const { sslVerify, followRedirects } = useSettingsStore();

  const tab = tabs.find((t) => t.tabId === tabId);
  const isLoading = loading[tabId] ?? false;

  const envGet = (key: string) => getVariable(key);
  const envSet = (key: string, value: string) => setVariable(key, value);

  async function send() {
    if (!tab) return;
    if (tab.type !== "http" && tab.type !== "graphql") {
      toast.info("Send is not available for this tab type");
      return;
    }
    if (!tab.url.trim()) {
      toast.warning("Enter a URL to send the request");
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(tabId, true);

    const allLogs: string[] = [];

    try {
      if (tab.type === "graphql") {
        const query = resolveVariables(tab.query).trim();
        if (!query) {
          toast.warning("Enter a GraphQL query");
          setLoading(tabId, false);
          return;
        }

        const resolvedUrl = resolveVariables(tab.url);
        const resolvedHeaders: KVPair[] = tab.headers.map((h) => ({
          ...h,
          key: resolveVariables(h.key),
          value: resolveVariables(h.value),
        }));

        const response = await runGraphQLRequest(
          {
            url: resolvedUrl,
            headers: resolvedHeaders,
            auth: tab.auth,
            query,
            variablesJson: resolveVariables(tab.variables),
            operationName: resolveVariables(tab.operationName),
            sslVerify,
            followRedirects,
          },
          abortRef.current.signal,
        );

        setResponse(tabId, response);
        return;
      }

      // ── Resolve env variables ──────────────────────────────────────────────
      const resolvedUrl = resolveVariables(tab.url);
      const resolvedHeaders: KVPair[] = tab.headers.map((h) => ({
        ...h,
        key: resolveVariables(h.key),
        value: resolveVariables(h.value),
      }));
      const resolvedParams: KVPair[] = tab.params.map((p) => ({
        ...p,
        key: resolveVariables(p.key),
        value: resolveVariables(p.value),
      }));
      const resolvedBody = {
        ...tab.body,
        content: resolveVariables(tab.body.content),
      };

      // ── Pre-request script ─────────────────────────────────────────────────
      let effectiveUrl = resolvedUrl;
      let effectiveHeaders = resolvedHeaders;
      let effectiveBody = resolvedBody;

      if (tab.preScript.trim()) {
        const preResult = runPreScript(
          tab.preScript,
          {
            url: resolvedUrl,
            headers: resolvedHeaders,
            method: tab.method,
            body: resolvedBody,
          },
          envGet,
          envSet,
        );

        allLogs.push(...preResult.logs);

        if (preResult.error) {
          toast.error("Pre-request script error", {
            description: preResult.error,
          });
        }

        if (preResult.requestOverrides) {
          if (preResult.requestOverrides.url !== undefined) {
            effectiveUrl = preResult.requestOverrides.url;
          }
          if (preResult.requestOverrides.headers !== undefined) {
            effectiveHeaders = preResult.requestOverrides.headers;
          }
          if (preResult.requestOverrides.body !== undefined) {
            effectiveBody = preResult.requestOverrides.body;
          }
        }
      }

      const finalUrl = buildFinalUrl(effectiveUrl, resolvedParams);

      const response = await runRequest(
        {
          method: tab.method,
          url: finalUrl,
          headers: effectiveHeaders,
          body: effectiveBody,
          auth: tab.auth,
          sslVerify,
          followRedirects,
        },
        abortRef.current.signal,
      );

      setResponse(tabId, response);

      // ── Post-response script ───────────────────────────────────────────────
      if (tab.postScript.trim()) {
        const postResult = runPostScript(
          tab.postScript,
          {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            body: response.body,
          },
          envGet,
          envSet,
        );

        allLogs.push(...postResult.logs);

        if (postResult.error) {
          toast.error("Post-response script error", {
            description: postResult.error,
          });
        }
      }

      addEntry({
        id: generateId(),
        method: tab.method,
        url: finalUrl,
        status: response.status,
        duration: response.duration,
        size: response.size,
        timestamp: response.timestamp,
        request: tab,
        response,
      });
    } catch (err) {
      const requestError = err as RequestError;
      setError(tabId, requestError);
      toast.error(`Request failed: ${requestError.message}`, {
        description: requestError.cause,
      });
    } finally {
      setScriptLogs(tabId, allLogs);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setLoading(tabId, false);
  }

  return { send, cancel, isLoading };
}
