"use client";

import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { runJs, runJsonPath } from "@/lib/transformRunner";
import type { PlaygroundMode } from "@/stores/usePlaygroundStore";
import { usePlaygroundStore } from "@/stores/usePlaygroundStore";

const CodeEditor = dynamic(() => import("@/components/request/CodeEditor"), {
  ssr: false,
});

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5MB

type TransformPlaygroundProps = {
  tabId: string;
  responseBody: string | null;
  responseStatus: number | null;
  responseHeaders: Record<string, string>;
};

const MODE_LABELS: Record<PlaygroundMode, string> = {
  jsonpath: "JSONPath",
  js: "JavaScript",
};

const JSONPATH_PLACEHOLDER = "data[*].email\n// ($. is auto-added)";
const JS_PLACEHOLDER =
  "data[0].email\n// (return response.json. is auto-added)\n// Or custom map: return response.json.map(x => x);";

export function TransformPlayground({
  tabId,
  responseBody,
  responseStatus,
  responseHeaders,
}: TransformPlaygroundProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { getPlayground, setMode, setCode, setResult } = usePlaygroundStore();
  const playground = getPlayground(tabId);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExecutingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const isTooLarge =
    responseBody !== null && responseBody.length > MAX_RESPONSE_BYTES;
  const hasResponse = responseBody !== null && responseBody.length > 0;

  const execute = useCallback(
    async (code: string, mode: PlaygroundMode, body: string) => {
      if (!code.trim()) {
        setResult(tabId, null, null);
        return;
      }

      isExecutingRef.current = true;

      const responseObj = {
        text: body,
        json: (() => {
          try {
            return JSON.parse(body);
          } catch {
            return null;
          }
        })(),
        status: responseStatus ?? 0,
        headers: responseHeaders,
      };

      const result =
        mode === "jsonpath"
          ? await runJsonPath(code, body)
          : await runJs(code, responseObj);

      isExecutingRef.current = false;

      if ("error" in result) {
        setResult(tabId, null, result.error);
      } else {
        setResult(tabId, result.output, null);
      }
    },
    [tabId, responseStatus, responseHeaders, setResult],
  );

  // Debounce execution on code changes
  function handleCodeChange(code: string) {
    setCode(tabId, code);

    if (!hasResponse || isTooLarge) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      execute(code, playground.mode, responseBody ?? "");
    }, 300);
  }

  // Re-run when response changes (new request sent)
  useEffect(() => {
    if (!hasResponse || !playground.code.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    execute(playground.code, playground.mode, responseBody ?? "");
    // intentionally run only when responseBody changes
  }, [responseBody]);

  function handleModeSwitch(mode: PlaygroundMode) {
    setMode(tabId, mode);
  }

  async function handleCopyOutput() {
    if (!playground.output) return;
    try {
      await navigator.clipboard.writeText(playground.output);
      toast.success("Output copied");
    } catch {
      toast.error("Failed to copy");
    }
  }

  const editorDisabled = !hasResponse || isTooLarge;
  const editorLanguage =
    playground.mode === "js" ? ("javascript" as const) : ("text" as const);

  return (
    <div className="border-t">
      {/* Header / toggle row */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        Transform
      </button>

      {isOpen && (
        <div className="border-t">
          {/* Mode toggle + copy button */}
          <div className="flex items-center gap-2 border-b px-3 py-1">
            <div className="flex rounded-md border overflow-hidden text-xs">
              {(["jsonpath", "js"] as PlaygroundMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleModeSwitch(m)}
                  className={`px-2 py-0.5 transition-colors ${
                    playground.mode === m
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <TooltipIconButton
                label="Copy output"
                onClick={handleCopyOutput}
                disabled={!playground.output}
              >
                <Copy className="h-3.5 w-3.5" />
              </TooltipIconButton>
            </div>
          </div>

          {/* Disabled states */}
          {!hasResponse && (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
              Send a request to use the Transform Playground
            </div>
          )}

          {hasResponse && isTooLarge && (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
              Response too large (&gt; 5MB) — download and transform locally
            </div>
          )}

          {/* Two-pane editor layout */}
          {hasResponse && !isTooLarge && (
            <div className="grid grid-cols-2 divide-x" style={{ height: 200 }}>
              {/* Left: editor */}
              <div
                className={`overflow-hidden ${playground.error ? "ring-1 ring-inset ring-destructive" : ""}`}
              >
                <CodeEditor
                  value={playground.code}
                  language={editorLanguage}
                  onChange={handleCodeChange}
                  readOnly={editorDisabled}
                  placeholder={
                    playground.mode === "jsonpath"
                      ? JSONPATH_PLACEHOLDER
                      : JS_PLACEHOLDER
                  }
                />
              </div>

              {/* Right: output */}
              <div className="overflow-auto p-2 text-xs font-mono">
                {playground.error ? (
                  <span className="text-destructive">{playground.error}</span>
                ) : playground.output === "[]" ? (
                  <span className="text-muted-foreground">[]</span>
                ) : playground.output ? (
                  <pre className="whitespace-pre-wrap break-all text-foreground">
                    {playground.output}
                  </pre>
                ) : (
                  <span className="text-muted-foreground">
                    Output will appear here
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
