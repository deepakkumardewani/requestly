"use client";

import { LayoutTemplate } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { REQUEST_TEMPLATES, templateToTabState } from "@/lib/requestTemplates";
import { useTabsStore } from "@/stores/useTabsStore";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  POST: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  PUT: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  PATCH: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  DELETE: "bg-red-500/15 text-red-600 dark:text-red-400",
};

type TemplateGalleryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TemplateGalleryModal({
  open,
  onOpenChange,
}: TemplateGalleryModalProps) {
  const openTab = useTabsStore((s) => s.openTab);

  function handleSelectTemplate(templateId: string) {
    const template = REQUEST_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    openTab(templateToTabState(template));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            New from Template
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {REQUEST_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className="group flex flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent"
              onClick={() => handleSelectTemplate(template.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-tight">
                  {template.name}
                </span>
                <Badge
                  className={`shrink-0 rounded px-1.5 py-0 text-[10px] font-semibold uppercase ${METHOD_COLORS[template.method] ?? ""}`}
                  variant="secondary"
                >
                  {template.method}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {template.description}
              </p>
              <p className="truncate text-[11px] text-muted-foreground/60 font-mono">
                {template.url}
              </p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
