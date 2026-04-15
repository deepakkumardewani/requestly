"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { useCloseTabGuard } from "@/hooks/useCloseTabGuard";
import { useTabsStore } from "@/stores/useTabsStore";
import type { TabState } from "@/types";

type TabContextMenuProps = {
  tab: TabState;
};

// Width of icon + mr-2 gap so icon-less items stay aligned
const ICON_OFFSET = "pl-[35px]";

export function TabContextMenu({ tab }: TabContextMenuProps) {
  const { tabs, openTab, closeTab, updateTabState } = useTabsStore();
  const { handleCloseTab, handleCloseOthers, handleCloseAll } =
    useCloseTabGuard();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameName, setRenameName] = useState(tab.name);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function commitRename() {
    const trimmed = renameName.trim();
    if (trimmed && trimmed !== tab.name) {
      // Preserve existing dirty state — a rename from the menu shouldn't dirty the tab
      updateTabState(tab.tabId, { name: trimmed, isDirty: tab.isDirty });
    }
    setIsRenaming(false);
  }

  if (isRenaming) {
    return (
      <ContextMenuContent>
        <div className="px-2 py-1.5">
          <Input
            ref={inputRef}
            autoFocus
            className="h-6 text-xs"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setIsRenaming(false);
            }}
          />
        </div>
      </ContextMenuContent>
    );
  }

  return (
    <>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            setRenameName(tab.name);
            setIsRenaming(true);
          }}
        >
          <Pencil className="mr-2 h-3.5 w-3.5 shrink-0" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          className={ICON_OFFSET}
          onClick={() => {
            switch (tab.type) {
              case "http":
                openTab({
                  type: "http",
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
                break;
              case "graphql":
                openTab({
                  type: "graphql",
                  name: tab.name,
                  url: tab.url,
                  headers: tab.headers,
                  query: tab.query,
                  variables: tab.variables,
                  operationName: tab.operationName,
                  auth: tab.auth,
                  isDirty: false,
                });
                break;
              case "websocket":
                openTab({
                  type: "websocket",
                  name: tab.name,
                  url: tab.url,
                  headers: tab.headers,
                  messageLog: [],
                  isDirty: false,
                });
                break;
              case "socketio":
                openTab({
                  type: "socketio",
                  name: tab.name,
                  url: tab.url,
                  headers: tab.headers,
                  messageLog: [],
                  isDirty: false,
                });
                break;
            }
          }}
        >
          Duplicate Tab
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className={ICON_OFFSET}
          onClick={() => handleCloseTab(tab)}
        >
          Close Tab
        </ContextMenuItem>
        <ContextMenuItem
          className={ICON_OFFSET}
          disabled={tabs.length <= 1}
          onClick={() => handleCloseOthers(tab.tabId)}
        >
          Close Other Tabs
        </ContextMenuItem>
        <ContextMenuItem
          className={ICON_OFFSET}
          onClick={() => handleCloseAll()}
        >
          Close All Tabs
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setTimeout(() => setConfirmDeleteOpen(true), 0)}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5 shrink-0" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>

      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete the request?"
        description={`"${tab.name}" will be permanently deleted.`}
        onConfirm={() => closeTab(tab.tabId)}
      />
    </>
  );
}
