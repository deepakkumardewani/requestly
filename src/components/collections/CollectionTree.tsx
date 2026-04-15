"use client";

import {
  FolderOpen,
  GitBranch,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";
import { VirtualizedRequestList } from "./VirtualizedRequestList";

export function CollectionTree() {
  const {
    collections,
    requests,
    createCollection,
    renameCollection,
    deleteCollection,
  } = useCollectionsStore();
  const activeRequestId = useTabsStore((s) => {
    const activeTab = s.tabs.find((t) => t.tabId === s.activeTabId);
    return activeTab?.requestId ?? null;
  });

  const { isCreatingCollection, setIsCreatingCollection } = useUIStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const newCollectionInputRef = useRef<HTMLInputElement>(null);

  // autoFocus won't work when the accordion is animating open (overflow:hidden).
  // Defer focus to after the animation completes.
  useEffect(() => {
    if (!isCreatingCollection) return;
    const timer = setTimeout(() => newCollectionInputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [isCreatingCollection]);

  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
        <EmptyState
          title="No collections"
          description="Create a collection to organize your requests"
          action={
            !isCreatingCollection ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingCollection(true)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Collection
              </Button>
            ) : undefined
          }
        />
        {isCreatingCollection && (
          <Input
            ref={newCollectionInputRef}
            className="h-7 w-full text-xs"
            value={newCollectionName}
            placeholder="Collection name"
            data-testid="new-collection-name-input"
            onChange={(e) => setNewCollectionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCollectionName.trim()) {
                createCollection(newCollectionName.trim());
                setNewCollectionName("");
                setIsCreatingCollection(false);
              }
              if (e.key === "Escape") setIsCreatingCollection(false);
            }}
            onBlur={() => setIsCreatingCollection(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="py-1">
      {isCreatingCollection && (
        <div className="px-2 pb-1">
          <Input
            ref={newCollectionInputRef}
            className="h-7 text-xs"
            value={newCollectionName}
            placeholder="Collection name"
            data-testid="new-collection-name-input"
            onChange={(e) => setNewCollectionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCollectionName.trim()) {
                createCollection(newCollectionName.trim());
                setNewCollectionName("");
                setIsCreatingCollection(false);
              }
              if (e.key === "Escape") setIsCreatingCollection(false);
            }}
            onBlur={() => setIsCreatingCollection(false)}
          />
        </div>
      )}

      <Accordion multiple className="w-full">
        {collections.map((collection) => {
          const collectionRequests = requests.filter(
            (r) => r.collectionId === collection.id,
          );

          return (
            <AccordionItem
              key={collection.id}
              value={collection.id}
              className="border-none"
              data-testid={`collection-item-${collection.id}`}
            >
              <ContextMenu>
                <ContextMenuTrigger>
                  <div className="group flex items-center rounded px-2 hover:bg-muted cursor-pointer">
                    <AccordionTrigger
                      chevronLeft
                      className="flex-1 py-1.5 hover:no-underline"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {editingId === collection.id ? (
                          <Input
                            autoFocus
                            className="h-5 py-0 text-xs"
                            value={editName}
                            data-testid="collection-rename-input"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                renameCollection(
                                  collection.id,
                                  editName.trim() || collection.name,
                                );
                                setEditingId(null);
                              }
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            onBlur={() => {
                              renameCollection(
                                collection.id,
                                editName.trim() || collection.name,
                              );
                              setEditingId(null);
                            }}
                          />
                        ) : (
                          <span
                            className="text-sm font-medium"
                            data-testid={`collection-name-${collection.id}`}
                          >
                            {collection.name}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {collectionRequests.length}
                        </span>
                      </div>

                      {/* Direct chain button — visible on hover */}
                      <button
                        type="button"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-foreground/10 dark:hover:bg-white/20 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/chain/${collection.id}`);
                        }}
                        title="Open chain view"
                      >
                        <GitBranch className="h-3 w-3 text-muted-foreground" />
                      </button>

                      {/* Dropdown sits before the auto-chevron so chevron ends up at far right */}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-foreground/10 dark:hover:bg-white/20"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`collection-more-btn-${collection.id}`}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            data-testid="collection-rename-btn"
                            onClick={() => {
                              setEditName(collection.name);
                              setEditingId(collection.id);
                            }}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/chain/${collection.id}`)
                            }
                          >
                            <GitBranch className="mr-2 h-3.5 w-3.5 " />
                            Chain View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            data-testid="collection-delete-btn"
                            onClick={() => setPendingDeleteId(collection.id)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </AccordionTrigger>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => {
                      setEditName(collection.name);
                      setEditingId(collection.id);
                    }}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => router.push(`/chain/${collection.id}`)}
                  >
                    <GitBranch className="mr-2 h-3.5 w-3.5" />
                    Chain View
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setPendingDeleteId(collection.id)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>

              <AccordionContent className="pb-1 pl-3 pr-1">
                {collectionRequests.length === 0 ? (
                  <p className="py-1 text-center text-[11px] text-muted-foreground">
                    No requests yet
                  </p>
                ) : (
                  <VirtualizedRequestList
                    requests={collectionRequests}
                    activeRequestId={activeRequestId}
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <ConfirmDeleteDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Delete Collection"
        description={`"${collections.find((c) => c.id === pendingDeleteId)?.name ?? "This collection"}" and all its requests will be permanently deleted.`}
        confirmLabel="Yes, delete collection"
        onConfirm={() => {
          if (pendingDeleteId) deleteCollection(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
