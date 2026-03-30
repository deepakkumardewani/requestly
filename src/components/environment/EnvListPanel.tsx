"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";

type EnvListPanelProps = {
  selectedEnvId: string | null;
  onSelect: (id: string) => void;
};

export function EnvListPanel({ selectedEnvId, onSelect }: EnvListPanelProps) {
  const {
    environments,
    activeEnvId,
    createEnv,
    updateEnv,
    deleteEnv,
    setActiveEnv,
  } = useEnvironmentsStore();

  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingNameId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingNameId]);

  function commitName(envId: string) {
    updateEnv(envId, { name: draftName.trim() || "New Environment" });
    setEditingNameId(null);
  }

  function handleAddEnvironment() {
    const env = createEnv("New Environment");
    onSelect(env.id);
    setActiveEnv(env.id);
    setDraftName("New Environment");
    setEditingNameId(env.id);
  }

  function handleConfirmDelete(envId: string) {
    const envName =
      environments.find((e) => e.id === envId)?.name ?? "this environment";
    const remaining = environments.filter((e) => e.id !== envId);
    const fallback = remaining.at(-1)?.id ?? null;

    deleteEnv(envId);
    setPendingDeleteId(null);
    toast.success(`"${envName}" deleted`);

    if (selectedEnvId === envId && fallback) {
      onSelect(fallback);
    }
  }

  const pendingEnvName = environments.find(
    (e) => e.id === pendingDeleteId,
  )?.name;

  return (
    <div className="flex w-[200px] shrink-0 flex-col border-r">
      <div className="border-b px-3 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Environments
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {environments.map((env) => (
          <div
            key={env.id}
            className={cn(
              "group relative mx-1 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5",
              selectedEnvId === env.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
            onClick={() => {
              onSelect(env.id);
              setActiveEnv(env.id);
            }}
          >
            {/* Active env indicator dot */}
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                activeEnvId === env.id ? "bg-method-accent" : "bg-transparent",
              )}
            />

            {editingNameId === env.id ? (
              <Input
                ref={inputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => commitName(env.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName(env.id);
                  if (e.key === "Escape") {
                    setEditingNameId(null);
                  }
                }}
                className="h-5 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 truncate text-xs"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setDraftName(env.name);
                  setEditingNameId(env.id);
                }}
                title="Double-click to rename"
              >
                {env.name}
              </span>
            )}

            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setPendingDeleteId(env.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-1.5 text-xs text-muted-foreground"
          onClick={handleAddEnvironment}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Environment
        </Button>
      </div>

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Environment</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingEnvName ? `"${pendingEnvName}"` : "This environment"} and
              all its variables will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                pendingDeleteId && handleConfirmDelete(pendingDeleteId)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
