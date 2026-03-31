"use client";

import { Braces, GitBranch, GitCompare, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ChainList } from "@/components/chain/ChainList";
import { CollectionTree } from "@/components/collections/CollectionTree";
import { EnvManagerDialog } from "@/components/environment/EnvManagerDialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";

export function LeftPanel() {
  const openTab = useTabsStore((s) => s.openTab);
  const { setIsCreatingCollection } = useUIStore();
  const [isCreatingChain, setIsCreatingChain] = useState(false);

  return (
    <>
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
          <div className="flex items-center gap-1">
            <TooltipProvider delay={400}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Transform Playground"
                      render={<Link href="/transform" />}
                    />
                  }
                >
                  <Braces className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Transform Playground
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="JSON Compare"
                      render={<Link href="/json-compare" />}
                    />
                  }
                >
                  <GitCompare className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="bottom">JSON Compare</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Settings"
                      render={<Link href="/settings" />}
                    />
                  }
                >
                  <Settings className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="bottom">Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
          <ResizablePanel defaultSize="50%" minSize="30%" maxSize="70%">
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Collections
                </span>
                <TooltipProvider delay={400}>
                  <Tooltip>
                    <TooltipTrigger
                      className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Add collection"
                      onClick={() => setIsCreatingCollection(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent side="right">Add Collection</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <ScrollArea className="min-h-0 flex-1 px-1">
                <CollectionTree />
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Chains panel */}
          <ResizablePanel defaultSize="20%" minSize="15%" maxSize="40%">
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex items-center justify-between border-t border-border px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Chains
                  </span>
                </div>
                <TooltipProvider delay={400}>
                  <Tooltip>
                    <TooltipTrigger
                      className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="New chain"
                      onClick={() => setIsCreatingChain(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent side="right">New Chain</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <ScrollArea className="min-h-0 flex-1 px-1">
                <ChainList
                  isCreating={isCreatingChain}
                  onCreatingDone={() => setIsCreatingChain(false)}
                />
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Recents panel */}
          <ResizablePanel defaultSize="30%" minSize="20%" maxSize="50%">
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex items-center justify-between border-t border-border px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent
                </span>
              </div>
              <ScrollArea className="min-h-0 flex-1 px-1">
                <HistoryList compact />
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <EnvManagerDialog />
    </>
  );
}
