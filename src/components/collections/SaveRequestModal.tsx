"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { TabState } from "@/types";

type SaveRequestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: TabState;
};

export function SaveRequestModal({
  open,
  onOpenChange,
  tab,
}: SaveRequestModalProps) {
  const { collections, addRequest, createCollection } = useCollectionsStore();
  const { updateTabState } = useTabsStore();

  const [requestName, setRequestName] = useState(tab.name);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(collections[0]?.id ?? null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(collections.length === 0);

  function handleSave() {
    let collectionId = selectedCollectionId;

    if (isCreatingNew && newCollectionName.trim()) {
      const col = createCollection(newCollectionName.trim());
      collectionId = col.id;
    }

    if (!collectionId) return;

    const savedRequest = addRequest(collectionId, {
      ...tab,
      name: requestName.trim() || tab.name,
    });

    updateTabState(tab.tabId, {
      name: requestName.trim() || tab.name,
      requestId: savedRequest.id,
      isDirty: false,
    });

    toast.success("Request saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="request-name">Request Name</Label>
            <Input
              id="request-name"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder="My Request"
            />
          </div>

          {!isCreatingNew && collections.length > 0 ? (
            <div className="space-y-2">
              <Label>Collection</Label>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-1">
                {collections.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedCollectionId(col.id)}
                    className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                      selectedCollectionId === col.id
                        ? "bg-method-accent/20 text-method-accent"
                        : "hover:bg-muted"
                    }`}
                  >
                    {col.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="text-xs text-method-accent hover:underline"
              >
                + Create new collection
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="collection-name">New Collection Name</Label>
              <Input
                id="collection-name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="My Collection"
              />
              {collections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-xs text-method-accent hover:underline"
                >
                  ← Select existing collection
                </button>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isCreatingNew ? !newCollectionName.trim() : !selectedCollectionId
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
