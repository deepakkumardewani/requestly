"use client";

import { Plus, X } from "lucide-react";
import { MethodBadge } from "@/components/common/MethodBadge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { useTabsStore } from "@/stores/useTabsStore";

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

  return (
    <div className="flex h-9 min-h-9 items-center border-b border-border bg-sidebar overflow-hidden">
      {/* Scrollable tab list + new tab button */}
      <div className="flex flex-1 items-center overflow-x-auto overflow-y-hidden scrollbar-none">
        {tabs.map((tab) => {
          const isActive = tab.tabId === activeTabId;
          return (
            <ContextMenu key={tab.tabId}>
              <ContextMenuTrigger>
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.tabId)}
                  className={cn(
                    "group relative flex h-9 max-w-[200px] min-w-[100px] shrink-0 items-center gap-1.5 border-r border-border px-3 text-xs transition-colors",
                    isActive
                      ? "bg-background text-foreground"
                      : "bg-sidebar text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <MethodBadge method={tab.method} />
                  <span className="flex-1 truncate text-left">
                    {tab.name || "New Request"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.tabId);
                    }}
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded transition-opacity",
                      isActive
                        ? "opacity-60 hover:opacity-100"
                        : "opacity-0 group-hover:opacity-60 hover:!opacity-100",
                    )}
                    aria-label={`Close ${tab.name || "New Request"} tab`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {/* Active tab bottom indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-method-accent" />
                  )}
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => closeTab(tab.tabId)}>
                  Close Tab
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    openTab({
                      name: tab.name,
                      method: tab.method,
                      url: tab.url,
                      params: tab.params,
                      headers: tab.headers,
                      auth: tab.auth,
                      body: tab.body,
                      preScript: tab.preScript,
                      postScript: tab.postScript,
                      isDirty: false,
                    });
                  }}
                >
                  Duplicate Tab
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  disabled={tabs.length <= 1}
                  onClick={() => closeOtherTabs(tab.tabId)}
                >
                  Close Other Tabs
                </ContextMenuItem>
                <ContextMenuItem onClick={() => closeAllTabs()}>
                  Close All Tabs
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}

        {/* New tab button — sits right after last tab */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="mx-1 shrink-0"
          onClick={() => openTab()}
          aria-label="New Request"
          title="New Request"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
