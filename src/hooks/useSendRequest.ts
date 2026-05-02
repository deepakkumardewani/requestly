"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { evaluateAllAssertions } from "@/lib/chainAssertions";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "@/lib/constants";
import { runGraphQLRequest, runRequest } from "@/lib/requestRunner";
import { runPostScript, runPreScript } from "@/lib/scriptRunner";
import {
  buildFinalUrl,
  generateId,
  mergeKvHeaders,
  prependGlobalBaseUrl,
} from "@/lib/utils";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useResponseStore } from "@/stores/useResponseStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { KVPair, RequestError } from "@/types";

const UNRESOLVED_VAR_REGEX = /\{\{(\w+)\}\}/g;

/** Returns all `{{var}}` placeholder names still present in the given strings. */
function extractUnresolvedVars(...texts: string[]): string[] {
  const found = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(UNRESOLVED_VAR_REGEX)) {
      found.add(match[1]);
    }
  }
  return [...found];
}

export function useSendRequest(tabId: string) {
  const abortRef = useRef<AbortController | null>(null);

  const { tabs } = useTabsStore();
  const { resolveVariables, getVariable, setVariable } = useEnvironmentsStore();
  const {
    setLoading,
    setResponse,
    setError,
    setScriptLogs,
    setAssertionResults,
    setUnresolvedVars,
    loading,
  } = useResponseStore();
  const { addEntry } = useHistoryStore();
  const { sslVerify, followRedirects, globalBaseUrl, globalHeaders } =
    useSettingsStore();

  const tab = tabs.find((t) => t.tabId === tabId);
  const isLoading = loading[tabId] ?? false;

  const envGet = (key: string) => getVariable(key);
  const envSet = (key: string, value: string) => setVariable(key, value);

  async function send(force = false) {
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

        const gqlUrlRaw = resolveVariables(tab.url);
        const resolvedUrl = prependGlobalBaseUrl(gqlUrlRaw, globalBaseUrl);
        const resolvedHeaders: KVPair[] = tab.headers.map((h) => ({
          ...h,
          key: resolveVariables(h.key),
          value: resolveVariables(h.value),
        }));
        const resolvedGlobalHeaders: KVPair[] = globalHeaders.map((h) => ({
          ...h,
          key: resolveVariables(h.key),
          value: resolveVariables(h.value),
        }));
        const mergedHeaders = mergeKvHeaders(
          resolvedGlobalHeaders,
          resolvedHeaders,
        );

        // Check for unresolved {{variable}} placeholders before dispatching
        if (!force) {
          const headerTexts = mergedHeaders.flatMap((h) => [h.key, h.value]);
          const unresolved = extractUnresolvedVars(
            resolvedUrl,
            ...headerTexts,
            query,
          );
          if (unresolved.length > 0) {
            setUnresolvedVars(tabId, unresolved);
            setLoading(tabId, false);
            return;
          }
        }
        setUnresolvedVars(tabId, []);

        const effectiveSslVerify =
          tab.sslVerify !== undefined ? tab.sslVerify : sslVerify;
        const effectiveFollowRedirects =
          tab.followRedirects !== undefined
            ? tab.followRedirects
            : followRedirects;

        const response = await runGraphQLRequest(
          {
            url: resolvedUrl,
            headers: mergedHeaders,
            auth: tab.auth,
            query,
            variablesJson: resolveVariables(tab.variables),
            operationName: resolveVariables(tab.operationName),
            sslVerify: effectiveSslVerify,
            followRedirects: effectiveFollowRedirects,
            timeoutMs:
              tab.timeoutMs !== undefined
                ? tab.timeoutMs
                : DEFAULT_REQUEST_TIMEOUT_MS,
          },
          abortRef.current.signal,
        );

        setResponse(tabId, response);
        return;
      }

      // ── Resolve env variables ──────────────────────────────────────────────
      const resolvedUrl = resolveVariables(tab.url);
      const resolvedGlobalHeaders: KVPair[] = globalHeaders.map((h) => ({
        ...h,
        key: resolveVariables(h.key),
        value: resolveVariables(h.value),
      }));
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

      // ── Pre-request script (sees tab URL/headers only, not globals) ─────────
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

      const urlAfterGlobalBase = prependGlobalBaseUrl(
        effectiveUrl,
        globalBaseUrl,
      );
      const mergedHeaders = mergeKvHeaders(
        resolvedGlobalHeaders,
        effectiveHeaders,
      );
      const finalUrl = buildFinalUrl(urlAfterGlobalBase, resolvedParams);

      // Check for unresolved {{variable}} placeholders before dispatching
      if (!force) {
        const headerTexts = mergedHeaders.flatMap((h) => [h.key, h.value]);
        const bodyText = effectiveBody.content ?? "";
        const unresolved = extractUnresolvedVars(
          finalUrl,
          ...headerTexts,
          bodyText,
        );
        if (unresolved.length > 0) {
          setUnresolvedVars(tabId, unresolved);
          setLoading(tabId, false);
          return;
        }
      }
      setUnresolvedVars(tabId, []);

      const effectiveSslVerify =
        tab.sslVerify !== undefined ? tab.sslVerify : sslVerify;
      const effectiveFollowRedirects =
        tab.followRedirects !== undefined
          ? tab.followRedirects
          : followRedirects;

      const response = await runRequest(
        {
          method: tab.method,
          url: finalUrl,
          headers: mergedHeaders,
          body: effectiveBody,
          auth: tab.auth,
          sslVerify: effectiveSslVerify,
          followRedirects: effectiveFollowRedirects,
          timeoutMs:
            tab.timeoutMs !== undefined
              ? tab.timeoutMs
              : DEFAULT_REQUEST_TIMEOUT_MS,
        },
        abortRef.current.signal,
      );

      setResponse(tabId, response);

      // Evaluate no-code assertions if any are defined
      if (tab.assertions && tab.assertions.length > 0) {
        const results = evaluateAllAssertions(tab.assertions, response);
        setAssertionResults(tabId, results);
      }

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

  function sendForce() {
    return send(true);
  }

  return { send, sendForce, cancel, isLoading };
}
