"use client";

import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnvVariableKeys } from "@/hooks/useEnvVariableKeys";
import { useTabsStore } from "@/stores/useTabsStore";

const CodeEditor = dynamic(() => import("./CodeEditor"), { ssr: false });

type ScriptEditorProps = {
  tabId: string;
};

export function ScriptEditor({ tabId }: ScriptEditorProps) {
  const { tabs, updateTabState } = useTabsStore();
  const tab = tabs.find((t) => t.tabId === tabId);
  const envVariables = useEnvVariableKeys();

  if (!tab) return null;
  if (tab.type !== "http") return null;

  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="pre" className="flex h-full flex-col">
        <TabsList className="h-8 shrink-0 rounded-none border-b bg-transparent px-3">
          <TabsTrigger value="pre" className="h-6 text-xs">
            Pre-Request
          </TabsTrigger>
          <TabsTrigger value="post" className="h-6 text-xs">
            Post-Response
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pre" className="mt-0 flex-1 overflow-hidden">
          <CodeEditor
            value={tab.preScript}
            language="javascript"
            onChange={(value) => updateTabState(tabId, { preScript: value })}
            envVariables={envVariables}
          />
        </TabsContent>

        <TabsContent value="post" className="mt-0 flex-1 overflow-hidden">
          <CodeEditor
            value={tab.postScript}
            language="javascript"
            onChange={(value) => updateTabState(tabId, { postScript: value })}
            envVariables={envVariables}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
