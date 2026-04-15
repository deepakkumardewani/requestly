"use client";

import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnvVariableKeys } from "@/hooks/useEnvVariableKeys";
import { useTabsStore } from "@/stores/useTabsStore";
import { AuthEditor } from "../AuthEditor";
import { HeadersEditor } from "../HeadersEditor";

const CodeEditor = dynamic(() => import("../CodeEditor"), { ssr: false });

type GraphQLTabsProps = {
  tabId: string;
};

export function GraphQLTabs({ tabId }: GraphQLTabsProps) {
  const { tabs, updateTabState } = useTabsStore();
  const tab = tabs.find((t) => t.tabId === tabId);
  const envVariables = useEnvVariableKeys();

  if (!tab || tab.type !== "graphql") return null;

  const enabledHeadersCount = tab.headers.filter(
    (h) => h.enabled && h.key,
  ).length;

  return (
    <Tabs defaultValue="query" className="flex h-full flex-col">
      <TabsList className="h-9 shrink-0 rounded-none border-b bg-transparent px-3 justify-start gap-0">
        <TabsTrigger
          value="query"
          data-testid="request-tab-graphql-query"
          className="h-8 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-b-method-accent data-[state=active]:text-method-accent"
        >
          Query
        </TabsTrigger>
        <TabsTrigger
          value="variables"
          data-testid="request-tab-graphql-variables"
          className="h-8 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-b-method-accent data-[state=active]:text-method-accent"
        >
          Variables
        </TabsTrigger>
        <TabsTrigger
          value="headers"
          data-testid="request-tab-headers"
          className="h-8 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-b-method-accent data-[state=active]:text-method-accent"
        >
          Headers
          {enabledHeadersCount > 0 && (
            <span className="ml-1 rounded-full bg-method-accent/20 px-1.5 py-0.5 text-[10px] text-method-accent">
              {enabledHeadersCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="auth"
          data-testid="request-tab-auth"
          className="h-8 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-b-method-accent data-[state=active]:text-method-accent"
        >
          Auth
          {tab.auth.type !== "none" && (
            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-method-accent" />
          )}
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden">
        <TabsContent value="query" className="mt-0 h-full overflow-hidden">
          <div className="h-full" data-testid="graphql-query-editor">
            <CodeEditor
              value={tab.query}
              language="javascript"
              onChange={(value) => updateTabState(tabId, { query: value })}
              envVariables={envVariables}
              className="h-full min-h-[200px]"
            />
          </div>
        </TabsContent>
        <TabsContent value="variables" className="mt-0 h-full overflow-hidden">
          <div className="h-full" data-testid="graphql-variables-editor">
            <CodeEditor
              value={tab.variables}
              language="json"
              onChange={(value) => updateTabState(tabId, { variables: value })}
              envVariables={envVariables}
              className="h-full min-h-[200px]"
            />
          </div>
        </TabsContent>
        <TabsContent value="headers" className="mt-0 h-full overflow-auto">
          <HeadersEditor tabId={tabId} />
        </TabsContent>
        <TabsContent value="auth" className="mt-0 h-full overflow-auto">
          <AuthEditor tabId={tabId} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
