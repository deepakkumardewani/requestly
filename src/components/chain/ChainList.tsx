"use client";

import { GitBranch, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useStandaloneChainStore } from "@/stores/useStandaloneChainStore";

type ChainListProps = {
  isCreating: boolean;
  onCreatingDone: () => void;
};

export function ChainList({ isCreating, onCreatingDone }: ChainListProps) {
  const { chains, createChain, renameChain, deleteChain } =
    useStandaloneChainStore();
  const router = useRouter();

  const [newChainName, setNewChainName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const chainList = Object.values(chains).sort(
    (a, b) => b.createdAt - a.createdAt,
  );

  const handleCreateConfirm = () => {
    const name = newChainName.trim();
    if (!name) {
      onCreatingDone();
      return;
    }
    const id = createChain(name);
    setNewChainName("");
    onCreatingDone();
    router.push(`/chain/${id}`);
  };

  return (
    <div className="py-1">
      {isCreating && (
        <div className="px-2 pb-1">
          <Input
            autoFocus
            className="h-7 text-xs"
            value={newChainName}
            placeholder="Chain name"
            onChange={(e) => setNewChainName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateConfirm();
              if (e.key === "Escape") {
                setNewChainName("");
                onCreatingDone();
              }
            }}
            onBlur={() => {
              setNewChainName("");
              onCreatingDone();
            }}
          />
        </div>
      )}

      {chainList.length === 0 && !isCreating ? (
        <div className="px-2 py-4">
          <EmptyState
            title="No chains"
            description="Create a chain to link requests together"
          />
        </div>
      ) : (
        <div className="space-y-0.5">
          {chainList.map((chain) => (
            <div
              key={chain.id}
              className="group flex items-center gap-1.5 rounded px-2 py-1.5 hover:bg-muted cursor-pointer"
              onClick={() => {
                if (editingId !== chain.id) router.push(`/chain/${chain.id}`);
              }}
            >
              <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

              {editingId === chain.id ? (
                <Input
                  autoFocus
                  className="h-5 py-0 text-xs flex-1"
                  value={editName}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      renameChain(chain.id, editName.trim() || chain.name);
                      setEditingId(null);
                    }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onBlur={() => {
                    renameChain(chain.id, editName.trim() || chain.name);
                    setEditingId(null);
                  }}
                />
              ) : (
                <span className="flex-1 truncate text-sm">{chain.name}</span>
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
                    onClick={() => {
                      setEditName(chain.name);
                      setEditingId(chain.id);
                    }}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteChain(chain.id)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
