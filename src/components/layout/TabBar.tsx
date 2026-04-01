"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCloseTabGuard } from "@/hooks/useCloseTabGuard";
import { modKey } from "@/lib/platform";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";
import { Tab } from "./Tab";
import { TabContextMenu } from "./TabContextMenu";
import { TabListDropdown } from "./TabListDropdown";

export function TabBar() {
  const {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    setActiveTab,
  } = useTabsStore();
  const {
    pendingCloseTabId,
    setPendingCloseTabId,
    pendingBulkClose,
    setPendingBulkClose,
  } = useUIStore();
  const { handleCloseTab } = useCloseTabGuard();

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTabCountRef = useRef(tabs.length);
  const [isOverflowing, setIsOverflowing] = useState(false);

  function checkOverflow() {
    const el = scrollRef.current;
    if (!el) return;
    setIsOverflowing(el.scrollWidth > el.clientWidth);
  }

  // Scroll right when a new tab is added so the new tab is visible
  useEffect(() => {
    if (tabs.length > prevTabCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
    prevTabCountRef.current = tabs.length;
    checkOverflow();
  }, [tabs.length]);

  // Re-check on container resize (e.g. window resize)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function confirmBulkClose() {
    if (!pendingBulkClose) return;
    if (pendingBulkClose.kind === "others") {
      closeOtherTabs(pendingBulkClose.keepTabId);
    } else {
      closeAllTabs();
    }
    setPendingBulkClose(null);
  }

  const dirtyOtherCount =
    pendingBulkClose?.kind === "others"
      ? tabs.filter((t) => t.tabId !== pendingBulkClose.keepTabId && t.isDirty)
          .length
      : tabs.filter((t) => t.isDirty).length;

  return (
    <>
      <div className="flex h-9 min-h-9 items-center border-b border-border bg-sidebar overflow-hidden">
        {/* Scrollable tab list with right-edge fade */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className="flex items-center overflow-x-auto overflow-y-hidden scrollbar-none"
          >
            {tabs.map((tab) => {
              const isActive = tab.tabId === activeTabId;
              return (
                <ContextMenu key={tab.tabId}>
                  <ContextMenuTrigger>
                    <Tab
                      tab={tab}
                      isActive={isActive}
                      onSelect={() => setActiveTab(tab.tabId)}
                      onClose={(e) => {
                        e.stopPropagation();
                        handleCloseTab(tab);
                      }}
                    />
                  </ContextMenuTrigger>
                  <TabContextMenu tab={tab} />
                </ContextMenu>
              );
            })}

            {/* Inline "+" — visible only when tabs fit without overflow */}
            {!isOverflowing && (
              <TooltipProvider delay={400}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openTab()}
                        aria-label="New Request"
                      />
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    New Request <Kbd>{modKey()}+N</Kbd>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Fade mask to signal clipped tabs on the right */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-sidebar to-transparent" />
        </div>

        {/* Fixed right-side actions — "+" only shown here when overflowing */}
        <div className="flex shrink-0 items-center gap-0.5 px-1">
          {isOverflowing && (
            <TooltipProvider delay={400}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openTab()}
                      aria-label="New Request"
                    />
                  }
                >
                  <Plus className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  New Request <Kbd>{modKey()}+N</Kbd>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TabListDropdown />
        </div>
      </div>

      {/* Single-tab close confirmation (also triggered via Ctrl+W / UI store) */}
      <AlertDialog
        open={!!pendingCloseTabId}
        onOpenChange={(open) => !open && setPendingCloseTabId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              This tab has unsaved changes. Close anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingCloseTabId) closeTab(pendingCloseTabId);
                setPendingCloseTabId(null);
              }}
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk close confirmation (Close Other Tabs / Close All Tabs) */}
      <AlertDialog
        open={!!pendingBulkClose}
        onOpenChange={(open) => !open && setPendingBulkClose(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              {dirtyOtherCount === 1
                ? "1 tab has unsaved changes."
                : `${dirtyOtherCount} tabs have unsaved changes.`}{" "}
              Close anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkClose}>
              Close All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
