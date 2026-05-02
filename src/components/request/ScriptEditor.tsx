"use client";

import { CheckCircle2, ShieldAlert, Wand2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnvVariableKeys } from "@/hooks/useEnvVariableKeys";
import { checkSyntax } from "@/lib/scriptLinter";
import { useTabsStore } from "@/stores/useTabsStore";

const CodeEditor = dynamic(() => import("./CodeEditor"), { ssr: false });

type LintStatus =
  | { state: "idle" }
  | { state: "ok" }
  | { state: "error"; message: string; line?: number; column?: number };

type ScriptEditorProps = {
  tabId: string;
};

export function ScriptEditor({ tabId }: ScriptEditorProps) {
  const { tabs, updateTabState } = useTabsStore();
  const tab = tabs.find((t) => t.tabId === tabId);
  const envVariables = useEnvVariableKeys();

  const [activeScript, setActiveScript] = useState<"pre" | "post">("pre");
  const [lintStatus, setLintStatus] = useState<LintStatus>({ state: "idle" });

  if (!tab) return null;
  if (tab.type !== "http") return null;

  function handleCheckSyntax() {
    if (!tab || tab.type !== "http") return;
    const code = activeScript === "pre" ? tab.preScript : tab.postScript;
    const result = checkSyntax(code ?? "");
    if (result.ok) {
      setLintStatus({ state: "ok" });
    } else {
      setLintStatus({
        state: "error",
        message: result.message,
        line: result.line,
        column: result.column,
      });
    }
  }

  function handleTabChange(value: string) {
    setActiveScript(value as "pre" | "post");
    setLintStatus({ state: "idle" });
  }

  return (
    <div className="flex h-full flex-col">
      <Tabs
        value={activeScript}
        onValueChange={handleTabChange}
        className="flex h-full flex-col"
      >
        <div className="flex items-center border-b">
          <TabsList className="h-8 shrink-0 rounded-none bg-transparent px-3">
            <TabsTrigger
              value="pre"
              data-testid="script-tab-pre"
              className="h-6 text-xs"
            >
              Pre-Request
            </TabsTrigger>
            <TabsTrigger
              value="post"
              data-testid="script-tab-post"
              className="h-6 text-xs"
            >
              Post-Response
            </TabsTrigger>
          </TabsList>

          <div className="ml-auto flex items-center gap-2 px-3">
            {lintStatus.state === "ok" && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                No errors
              </span>
            )}
            {lintStatus.state === "error" && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                <ShieldAlert className="h-3 w-3" />
                {lintStatus.line != null
                  ? `Line ${lintStatus.line}:${lintStatus.column ?? 0} — `
                  : ""}
                {lintStatus.message}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1.5 text-[11px]"
              onClick={handleCheckSyntax}
              data-testid="check-syntax-btn"
            >
              <Wand2 className="h-3 w-3" />
              Check Syntax
            </Button>
          </div>
        </div>

        <TabsContent value="pre" className="mt-0 flex-1 overflow-hidden">
          <div data-testid="pre-script-editor" className="h-full">
            <CodeEditor
              value={tab.preScript}
              language="javascript"
              onChange={(value) => {
                updateTabState(tabId, { preScript: value });
                setLintStatus({ state: "idle" });
              }}
              envVariables={envVariables}
            />
          </div>
        </TabsContent>

        <TabsContent value="post" className="mt-0 flex-1 overflow-hidden">
          <div data-testid="post-script-editor" className="h-full">
            <CodeEditor
              value={tab.postScript}
              language="javascript"
              onChange={(value) => {
                updateTabState(tabId, { postScript: value });
                setLintStatus({ state: "idle" });
              }}
              envVariables={envVariables}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
