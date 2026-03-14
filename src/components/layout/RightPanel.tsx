"use client";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useUIStore } from "@/stores/useUIStore";
import { UrlBar } from "@/components/request/UrlBar";
import { RequestTabs } from "@/components/request/RequestTabs";
import { ResponsePanel } from "@/components/response/ResponsePanel";
import { useTabsStore } from "@/stores/useTabsStore";
import { TabBar } from "./TabBar";

export function RightPanel() {
  const { setSplitRatio } = useUIStore();
  const { activeTabId } = useTabsStore();

  if (!activeTabId) return null;

  return (
    <div className="flex h-full flex-col">
      <TabBar />
      <UrlBar tabId={activeTabId} />
      <ResizablePanelGroup
        orientation="vertical"
        className="flex-1 overflow-hidden"
        onLayoutChanged={(sizes) => {
          if (sizes[0] !== undefined) setSplitRatio(sizes[0]);
        }}
      >
        <ResizablePanel defaultSize="50%" minSize="20%">
          <RequestTabs tabId={activeTabId} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="50%" minSize="20%" maxSize="70%">
          <ResponsePanel tabId={activeTabId} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
