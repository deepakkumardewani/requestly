"use client";

import { CodeGenPanel } from "@/components/request/CodeGenPanel";
import { RequestTabs } from "@/components/request/RequestTabs";
import { UrlBar } from "@/components/request/UrlBar";
import { ResponsePanel } from "@/components/response/ResponsePanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";
import { EmptyState } from "./EmptyState";
import { RequestBreadcrumb } from "./RequestBreadcrumb";
import { TabBar } from "./TabBar";

export function RightPanel() {
  const { setSplitRatio } = useUIStore();
  const { activeTabId, tabs } = useTabsStore();

  const activeTab = tabs.find((t) => t.tabId === activeTabId);
  const hideHttpResponsePanel =
    activeTab?.type === "websocket" || activeTab?.type === "socketio";

  const requestColumn = activeTabId ? (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1">
        <RequestTabs tabId={activeTabId} />
      </div>
      {activeTab ? <CodeGenPanel tab={activeTab} /> : null}
    </div>
  ) : null;

  return (
    <div className="flex h-full flex-col">
      <RequestBreadcrumb tabId={activeTabId} />
      <TabBar />
      {activeTabId ? (
        <>
          <UrlBar tabId={activeTabId} />
          {hideHttpResponsePanel ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {requestColumn}
            </div>
          ) : (
            <ResizablePanelGroup
              orientation="vertical"
              className="flex-1 overflow-hidden"
              onLayoutChanged={(sizes) => {
                if (sizes[0] !== undefined) setSplitRatio(sizes[0]);
              }}
            >
              <ResizablePanel defaultSize="50%" minSize="20%">
                {requestColumn}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="50%" minSize="20%" maxSize="70%">
                <ResponsePanel tabId={activeTabId} />
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
