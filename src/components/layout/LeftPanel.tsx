"use client";

import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { CollectionTree } from "@/components/collections/CollectionTree";
import { EnvSelector } from "@/components/environment/EnvSelector";
import { HistoryList } from "@/components/history/HistoryList";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTabsStore } from "@/stores/useTabsStore";

export function LeftPanel() {
  const openTab = useTabsStore((s) => s.openTab);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-method-accent/20">
            <span className="text-sm font-bold text-method-accent">R</span>
          </div>
          <span className="text-sm font-semibold">Requestly</span>
        </div>
        <Link href="/settings">
          <Button variant="ghost" size="icon-sm" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* New Request Button */}
      <div className="px-3 pb-2">
        <Button
          className="w-full justify-start gap-2"
          size="sm"
          onClick={() => openTab()}
        >
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Environment Selector */}
      <div className="px-3 pb-2">
        <EnvSelector />
      </div>

      <Separator />

      {/* Resizable Collections + Recents */}
      <ResizablePanelGroup
        orientation="vertical"
        className="flex-1 overflow-hidden"
      >
        {/* Collections panel */}
        <ResizablePanel defaultSize="50%" minSize="50%" maxSize="70%">
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Collections
              </span>
            </div>
            <ScrollArea className="flex-1 px-1">
              <CollectionTree />
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Recents panel */}
        <ResizablePanel defaultSize="50%" minSize="30%" maxSize="50%">
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center justify-between border-t border-border px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent
              </span>
            </div>
            <ScrollArea className="flex-1 px-1">
              <HistoryList compact />
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
