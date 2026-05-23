"use client";

import { MethodBadge } from "@/components/common/MethodBadge";
import { CodeGenPanel } from "@/components/request/CodeGenPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HttpTab } from "@/types";

type CodeGenDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: HttpTab;
};

export function CodeGenDialog({ open, onOpenChange, tab }: CodeGenDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[min(85vh,640px)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        data-testid="code-gen-dialog"
      >
        <DialogHeader className="border-b px-4 py-3">
          <div className="flex items-center gap-2 pr-8">
            <MethodBadge method={tab.method} />
            <DialogTitle className="truncate">{tab.name}</DialogTitle>
          </div>
          <DialogDescription className="truncate font-mono text-xs">
            {tab.url || "No URL"}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1">
          <CodeGenPanel tab={tab} variant="tab" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
