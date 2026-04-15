"use client";

import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { HealthDot } from "@/components/collections/HealthDot";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { MethodBadge } from "@/components/common/MethodBadge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { generateId } from "@/lib/utils";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { HttpTab, RequestModel } from "@/types";

type RequestItemProps = {
  request: RequestModel;
  isActive: boolean;
};

export function RequestItem({ request, isActive }: RequestItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(request.name);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const openTabForRequest = useTabsStore((s) =>
    s.tabs.find((t) => t.requestId === request.id),
  );
  // Selecting actions individually: they're stable function references so
  // these selectors never trigger a re-render when tab state changes.
  const openTab = useTabsStore((s) => s.openTab);
  const setActiveTab = useTabsStore((s) => s.setActiveTab);
  const updateTabState = useTabsStore((s) => s.updateTabState);
  const updateRequest = useCollectionsStore((s) => s.updateRequest);
  const deleteRequest = useCollectionsStore((s) => s.deleteRequest);
  const addRequest = useCollectionsStore((s) => s.addRequest);
  const showHealthMonitor = useSettingsStore((s) => s.showHealthMonitor);

  function handleOpen() {
    if (isEditing) return;
    if (openTabForRequest) {
      setActiveTab(openTabForRequest.tabId);
      return;
    }
    openTab({
      type: "http",
      requestId: request.id,
      name: request.name,
      method: request.method,
      url: request.url,
      params: request.params,
      headers: request.headers,
      auth: request.auth,
      body: request.body,
      preScript: request.preScript,
      postScript: request.postScript,
      isDirty: false,
    });
  }

  function handleRename() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== request.name) {
      updateRequest(request.id, { name: trimmed });
      // Sync the name on any open tab that references this request
      if (openTabForRequest) {
        updateTabState(openTabForRequest.tabId, {
          name: trimmed,
          isDirty: openTabForRequest.isDirty,
        });
      }
    }
    setIsEditing(false);
  }

  function handleDuplicate() {
    const duplicateTab: HttpTab = {
      tabId: generateId(),
      requestId: null,
      name: `${request.name} (copy)`,
      isDirty: false,
      type: "http",
      method: request.method,
      url: request.url,
      params: request.params,
      headers: request.headers,
      auth: request.auth,
      body: request.body,
      preScript: request.preScript,
      postScript: request.postScript,
    };
    addRequest(request.collectionId, duplicateTab);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          role="button"
          tabIndex={0}
          data-testid="request-item"
          className={`group flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors cursor-pointer ${
            isActive
              ? "border-l-2 border-l-method-accent bg-method-accent/10 pl-[calc(0.5rem-2px)]"
              : "hover:bg-muted"
          }`}
          onClick={handleOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleOpen();
          }}
        >
          <MethodBadge method={request.method} />

          {isEditing ? (
            <Input
              className="h-5 flex-1 py-0 text-xs"
              value={editName}
              autoFocus
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setIsEditing(false);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 truncate text-sm">{request.name}</span>
          )}

          {showHealthMonitor && request.url && (
            <HealthDot method={request.method} url={request.url} />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
              data-testid="request-item-more-btn"
            >
              <MoreHorizontal className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                data-testid="request-rename-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate();
                }}
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                data-testid="request-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 h-3.5 w-3.5" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setConfirmDeleteOpen(true)}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>

      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete the request?"
        description={`"${request.name}" will be permanently deleted.`}
        onConfirm={() => deleteRequest(request.id)}
      />
    </ContextMenu>
  );
}
