"use client";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";
import { useMethodTheme } from "@/hooks/useMethodTheme";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CommandPalette } from "@/components/common/CommandPalette";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";

export function MainLayout() {
  const { tabs, activeTabId } = useTabsStore();
  const { mobileSidebarOpen, toggleMobileSidebar, setLeftPanelWidth } =
    useUIStore();

  const activeTab = tabs.find((t) => t.tabId === activeTabId);
  const activeMethod = activeTab?.method ?? "GET";

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
