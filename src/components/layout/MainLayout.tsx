"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { CommandPalette } from "@/components/common/CommandPalette";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMethodTheme } from "@/hooks/useMethodTheme";
import { decodeShareLink } from "@/lib/shareLink";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";

export function MainLayout() {
  const { tabs, activeTabId, openTab } = useTabsStore();
  const { mobileSidebarOpen, toggleMobileSidebar, setLeftPanelWidth } =
    useUIStore();

  const activeTab = tabs.find((t) => t.tabId === activeTabId);
  const activeMethod = activeTab?.method ?? "GET";

  // Hydrate a tab from a ?r= share link on first mount
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("r");
    if (!raw) return;

    const payload = decodeShareLink(raw);
    if (payload) {
      openTab({
        name: `${payload.method} ${payload.url || "Shared Request"}`,
        method: payload.method,
        url: payload.url,
        headers: payload.headers,
        params: payload.params,
        body: payload.body,
        auth: payload.auth,
      });
    }

    if (payload) {
      toast.success("Request loaded from shared link");
    } else {
      toast.error("Invalid share link");
    }

    // Strip the ?r= param from the URL without triggering a navigation
    history.replaceState({}, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drive the whole UI's accent color from the active method
  useMethodTheme(activeMethod);
  // Global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop: resizable two-column layout */}
      <ResizablePanelGroup
        orientation="horizontal"
        className="hidden md:flex"
        // onLayoutChanged={(sizes) => {
        //   if (sizes[0] !== undefined) {
        //     setLeftPanelWidth(sizes[0]);
        //   }
        // }}
      >
        <ResizablePanel
          defaultSize="20%"
          minSize="10%"
          maxSize="90%"
          className="border-r border-border"
        >
          <LeftPanel />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="80%" minSize="80%">
          <RightPanel />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Mobile: full RightPanel + Sheet for sidebar */}
      <div className="flex w-full md:hidden">
        <RightPanel />
      </div>
      <Sheet open={mobileSidebarOpen} onOpenChange={toggleMobileSidebar}>
        <SheetContent side="left" className="w-72 p-0">
          <LeftPanel />
        </SheetContent>
      </Sheet>

      {/* Command Palette — always mounted, visibility controlled by store */}
      <CommandPalette />
    </div>
  );
}
