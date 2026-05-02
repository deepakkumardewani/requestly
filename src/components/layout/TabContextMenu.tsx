"use client";

import { Palette, Pencil, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCloseTabGuard } from "@/hooks/useCloseTabGuard";
import { cn } from "@/lib/utils";
import { useTabsStore } from "@/stores/useTabsStore";
import type { TabState } from "@/types";

type TabContextMenuProps = {
  tab: TabState;
};

// Width of icon + mr-2 gap so icon-less items stay aligned
const ICON_OFFSET = "pl-[35px]";

const LABEL_COLORS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Orange", value: "#f97316" },
  { label: "Red", value: "#ef4444" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
] as const;

export function TabContextMenu({ tab }: TabContextMenuProps) {
  const { tabs, openTab, closeTab, updateTabState, setTabLabel } =
    useTabsStore();
  const { handleCloseTab, handleCloseOthers, handleCloseAll } =
    useCloseTabGuard();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameName, setRenameName] = useState(tab.name);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(tab.color ?? "");
  const [groupName, setGroupName] = useState(tab.group ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  function commitRename() {
    const trimmed = renameName.trim();
    if (trimmed && trimmed !== tab.name) {
      // Preserve existing dirty state — a rename from the menu shouldn't dirty the tab
      updateTabState(tab.tabId, { name: trimmed, isDirty: tab.isDirty });
    }
    setIsRenaming(false);
  }

  function openLabelDialog() {
    setSelectedColor(tab.color ?? "");
    setGroupName(tab.group ?? "");
    // Defer to allow context menu to close first
    setTimeout(() => setLabelDialogOpen(true), 0);
  }

  function applyLabel() {
    setTabLabel(tab.tabId, groupName, selectedColor);
    setLabelDialogOpen(false);
  }

  function clearLabel() {
    setTabLabel(tab.tabId, "", "");
    setGroupName("");
    setSelectedColor("");
    setLabelDialogOpen(false);
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
        <ContextMenuItem onClick={openLabelDialog}>
          <Palette className="mr-2 h-3.5 w-3.5 shrink-0" />
          Set Label
          {tab.color && (
            <span
              className="ml-auto h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: tab.color }}
            />
          )}
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

      {/* Label dialog — rendered outside ContextMenuContent so it survives menu close */}
      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent className="max-w-xs" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Set Label</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Color
              </p>
              <div className="flex gap-2">
                {LABEL_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() =>
                      setSelectedColor(selectedColor === c.value ? "" : c.value)
                    }
                    className={cn(
                      "h-5 w-5 rounded-full transition-all ring-offset-1",
                      selectedColor === c.value
                        ? "ring-2 ring-foreground"
                        : "hover:ring-2 hover:ring-muted-foreground",
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
                {selectedColor && (
                  <button
                    type="button"
                    title="Clear color"
                    onClick={() => setSelectedColor("")}
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Group name (optional)
              </p>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. Auth, Admin…"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyLabel();
                  if (e.key === "Escape") setLabelDialogOpen(false);
                }}
              />
            </div>
          </div>

          <DialogFooter>
            {(tab.color || tab.group) && (
              <Button variant="ghost" size="sm" onClick={clearLabel}>
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLabelDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={applyLabel}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
