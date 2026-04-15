"use client";

import { Braces, Eraser, Wand2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { runJs, runJsonPath } from "@/lib/transformRunner";
import {
  type TransformMode,
  useTransformStore,
} from "@/stores/useTransformStore";

const CodeEditor = dynamic(() => import("@/components/request/CodeEditor"), {
  ssr: false,
});

const DEBOUNCE_MS = 300;

export function TransformPage() {
  const {
    inputBody,
    code,
    mode,
    output,
    error,
    setInputBody,
    setCode,
    setMode,
    setResult,
    clear,
  } = useTransformStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExecutingRef = useRef(false);

  const parsedInputJson = useMemo(() => {
    try {
      return JSON.parse(inputBody);
    } catch {
      return null;
    }
  }, [inputBody]);

  const execute = useCallback(
    async (currentCode: string, currentMode: TransformMode) => {
      if (!currentCode.trim()) {
        setResult(null, null);
        return;
      }

      isExecutingRef.current = true;

      const responseObj = {
        text: inputBody,
        json: parsedInputJson,
        status: 200,
        headers: {},
      };

      const result =
        currentMode === "jsonpath"
          ? await runJsonPath(currentCode, inputBody)
          : await runJs(currentCode, responseObj);

      isExecutingRef.current = false;

      if ("error" in result) {
        setResult(null, result.error);
      } else {
        setResult(result.output, null);
      }
    },
    [setResult, inputBody, parsedInputJson],
  );

  // Debounced execution when code, mode, or inputBody changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      execute(code, mode);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [code, mode, inputBody, execute]);

  const handleFormatJson = useCallback(() => {
    if (!inputBody.trim()) return;
    if (parsedInputJson !== null) {
      setInputBody(JSON.stringify(parsedInputJson, null, 2));
    }
  }, [inputBody, parsedInputJson, setInputBody]);

  function computePlaceholder(
    text: string,
    currentMode: TransformMode,
  ): string {
    if (!text.trim()) {
      return currentMode === "jsonpath"
        ? "data[*].email\n// ($. is auto-added)"
        : "data[0].email\n// (return response.json. is auto-added)\n// Or custom map: return response.json.map(x => x);";
    }

    const snippet = text.slice(0, 5000).trim();
    if (!snippet.startsWith("{") && !snippet.startsWith("[")) {
      return currentMode === "jsonpath"
        ? "// Note: Input does not seem like valid JSON\ndata[*]"
        : "return response.text.split('\\n')[0];";
    }

    const isArray = snippet.startsWith("[");
    const keys: string[] = [];
    const regex = /"([a-zA-Z0-9_]+)"\s*:/g;
    let match: RegExpExecArray | null = regex.exec(snippet);
    while (match !== null && keys.length < 3) {
      if (!keys.includes(match[1])) {
        keys.push(match[1]);
      }
      match = regex.exec(snippet);
    }

    if (currentMode === "jsonpath") {
      if (isArray) {
        return keys.length > 0
          ? `// Examples ($. is auto-added):\n// [*].${keys[0]}\n// [0].${keys[0]}\n// [*]`
          : `// Examples ($. is auto-added):\n// [*]\n// [0]`;
      }
      if (keys.length > 0) {
        const topKey = keys[0];
        return keys.length > 1
          ? `// Examples ($. is auto-added):\n// ${topKey}\n// ..${keys[1]}`
          : `// Examples ($. is auto-added):\n// ${topKey}\n// ..${topKey}`;
      }
      return `// Examples ($. is auto-added):\n// data\n// ..id`;
    }

    // JS mode
    if (isArray) {
      return keys.length > 0
        ? `// Examples (return response.json. is auto-added):\n// map(x => x.${keys[0]})\n// [0]`
        : `// Examples (return response.json. is auto-added):\n// [0]\n// filter(x => x)`;
    }
    return keys.length > 0
      ? `// Examples (return response.json. is auto-added):\n// ${keys[0]}\n// return Object.keys(response.json);`
      : `// Examples (return response.json. is auto-added):\n// return response.json;\n// return response.headers;`;
  }

  const editorLanguage = mode === "js" ? "javascript" : "text";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mr-4 px-2">
          <Braces className="h-4 w-4 text-method-accent" />
          Transform Playground
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={!inputBody.trim() && !code.trim() && !output && !error}
          className="gap-1.5"
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        {/* Left: Input Payload */}
        <ResizablePanel defaultSize="50%" maxSize="70%">
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-3 py-1.5 bg-muted/20">
              <span className="text-xs font-medium text-muted-foreground">
                Input Data (JSON)
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleFormatJson}
                disabled={!inputBody.trim()}
                title="Format JSON"
              >
                <Wand2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <CodeEditor
                value={inputBody}
                language="json"
                onChange={setInputBody}
                placeholder='{ "paste": "your JSON here" }'
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Code Editor & Output */}
        <ResizablePanel defaultSize="50%" minSize="30%" maxSize="50%">
          <ResizablePanelGroup orientation="vertical">
            {/* Top Right: Code */}
            <ResizablePanel defaultSize="30%" minSize="30%" maxSize="50%">
              <div className="flex h-full flex-col overflow-hidden">
                <div className="flex items-center gap-2 border-b px-3 py-1 bg-muted/20">
                  <div className="flex rounded-md border overflow-hidden text-xs">
                    {(["jsonpath", "js"] as TransformMode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`px-3 py-1 transition-colors ${
                          mode === m
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {m === "jsonpath" ? "JSONPath" : "JavaScript"}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  className={`flex-1 overflow-hidden min-h-0 ${error ? "ring-1 ring-inset ring-destructive/50" : ""}`}
                >
                  <CodeEditor
                    value={code}
                    language={editorLanguage}
                    onChange={setCode}
                    placeholder={computePlaceholder(inputBody, mode)}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Bottom Right: Output */}
            <ResizablePanel defaultSize="70%" minSize="50%" maxSize="70%">
              <div className="flex h-full flex-col overflow-hidden bg-muted/5">
                <div className="border-b px-3 py-1.5 flex flex-col justify-center bg-muted/20 h-[37px]">
                  <span className="text-xs font-medium text-muted-foreground">
                    Output
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-3 text-xs font-mono">
                  {error ? (
                    <span className="text-destructive break-words whitespace-pre-wrap">
                      {error}
                    </span>
                  ) : output === "[]" ? (
                    <span className="text-muted-foreground">[]</span>
                  ) : output ? (
                    <pre className="whitespace-pre-wrap break-all text-foreground text-sm">
                      {output}
                    </pre>
                  ) : (
                    <span className="text-muted-foreground/60 italic">
                      Output will appear here...
                    </span>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
