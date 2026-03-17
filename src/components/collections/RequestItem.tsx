"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Copy, Trash2, FolderInput } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MethodBadge } from "@/components/common/MethodBadge";
import { useTabsStore } from "@/stores/useTabsStore";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { HealthDot } from "@/components/collections/HealthDot";
import type { RequestModel } from "@/types";
import { generateId } from "@/lib/utils";

type RequestItemProps = {
  request: RequestModel;
  isActive: boolean;
};

export function RequestItem({ request, isActive }: RequestItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(request.name);

  const { tabs, openTab, setActiveTab } = useTabsStore();
  const { updateRequest, deleteRequest, addRequest } = useCollectionsStore();
  const showHealthMonitor = useSettingsStore((s) => s.showHealthMonitor);

  function handleOpen() {
    if (isEditing) return;
    const existing = tabs.find((t) => t.requestId === request.id);
    if (existing) {
      setActiveTab(existing.tabId);
      return;
    }
    openTab({
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
    }
    setIsEditing(false);
  }

  function handleDuplicate() {
    addRequest(request.collectionId, {
      tabId: generateId(),
      requestId: request.id,
      name: `${request.name} (copy)`,
      isDirty: false,
      method: request.method,
      url: request.url,
      params: request.params,
      headers: request.headers,
      auth: request.auth,
      body: request.body,
      preScript: request.preScript,
      postScript: request.postScript,
    });
  }

  return (
    <div
      className={`group flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors cursor-pointer ${
        isActive
          ? "border-l-2 border-l-method-accent bg-method-accent/10 pl-[calc(0.5rem-2px)]"
          : "hover:bg-muted"
      }`}
      onClick={handleOpen}
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
        <span className="flex-1 truncate text-xs">
          {request.name}
        </span>
      )}

      {showHealthMonitor && request.url && (
        <HealthDot method={request.method} url={request.url} />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
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
            onClick={(e) => {
              e.stopPropagation();
              deleteRequest(request.id);
            }}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
