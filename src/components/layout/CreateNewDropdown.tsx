"use client";

import {
  ArrowLeftRight,
  Braces,
  FolderPlus,
  GitBranch,
  Globe,
  Globe2,
  Plus,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";

type CreateNewDropdownProps = {
  onNewChain: () => void;
};

export function CreateNewDropdown({ onNewChain }: CreateNewDropdownProps) {
  const openTab = useTabsStore((s) => s.openTab);
  const { setIsCreatingCollection, setEnvManagerOpen } = useUIStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label="Create new" />
        }
      >
        <Plus className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => openTab()}>
          <Globe className="mr-2 h-3.5 w-3.5" />
          HTTP
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openTab()}>
          <Braces className="mr-2 h-3.5 w-3.5" />
          GraphQL
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openTab()}>
          <ArrowLeftRight className="mr-2 h-3.5 w-3.5" />
          WebSocket
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openTab()}>
          <Zap className="mr-2 h-3.5 w-3.5" />
          Socket.IO
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setIsCreatingCollection(true)}>
          <FolderPlus className="mr-2 h-3.5 w-3.5" />
          Collection
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEnvManagerOpen(true)}>
          <Globe2 className="mr-2 h-3.5 w-3.5" />
          Environment
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNewChain}>
          <GitBranch className="mr-2 h-3.5 w-3.5" />
          Chain
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
