"use client";

import { FolderOpen, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
import { RequestItem } from "./RequestItem";

export function CollectionTree() {
  const {
    collections,
    requests,
    createCollection,
    renameCollection,
    deleteCollection,
    addRequest,
  } = useCollectionsStore();
  const { activeTabId, tabs } = useTabsStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  const activeTab = tabs.find((t) => t.tabId === activeTabId);

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
            autoFocus
            className="h-7 w-full text-xs"
            value={newCollectionName}
            placeholder="Collection name"
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
            autoFocus
            className="h-7 text-xs"
            value={newCollectionName}
            placeholder="Collection name"
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
            >
              <div className="group flex items-center gap-1 px-2 hover:bg-muted rounded">
                <AccordionTrigger className="flex-1 py-1.5 hover:no-underline">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {editingId === collection.id ? (
                      <Input
                        autoFocus
                        className="h-5 py-0 text-xs"
                        value={editName}
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
                      <span className="text-xs font-medium">
                        {collection.name}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {collectionRequests.length}
                    </span>
                  </div>
                </AccordionTrigger>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditName(collection.name);
                        setEditingId(collection.id);
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => deleteCollection(collection.id)}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <AccordionContent className="pb-1 pl-3 pr-1">
                {collectionRequests.length === 0 ? (
                  <p className="py-1 text-center text-[11px] text-muted-foreground">
                    No requests yet
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {collectionRequests.map((req) => (
                      <RequestItem
                        key={req.id}
                        request={req}
                        isActive={activeTab?.requestId === req.id}
                      />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="px-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-1.5 text-xs text-muted-foreground"
          onClick={() => setIsCreatingCollection(true)}
        >
          <Plus className="h-3 w-3" />
          New Collection
        </Button>
      </div>
    </div>
  );
}
