"use client";

import { GitBranch, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { generateId } from "@/lib/utils";
import type { ConditionBranch, ConditionNodeConfig } from "@/types/chain";

const MIN_BRANCHES = 1;

type ConditionConfigPanelProps = {
  open: boolean;
  node: ConditionNodeConfig | null;
  onClose: () => void;
  onSave: (node: ConditionNodeConfig) => void;
  onDelete: (nodeId: string) => void;
};

function makeBranch(label = "", expression = ""): ConditionBranch {
  return { id: generateId(), label, expression };
}

export function ConditionConfigPanel({
  open,
  node,
  onClose,
  onSave,
  onDelete,
}: ConditionConfigPanelProps) {
  const [variable, setVariable] = useState("");
  const [branches, setBranches] = useState<ConditionBranch[]>([]);

  // Sync local state when the node changes
  useEffect(() => {
    if (!node) return;
    setVariable(node.variable);
    setBranches(
      node.branches.length > 0
        ? node.branches
        : [makeBranch("", ""), makeBranch("else", "")],
    );
  }, [node]);

  if (!node) return null;

  function handleSave() {
    if (!node) return;
    onSave({ ...node, variable, branches });
    onClose();
  }

  function handleAddBranch() {
    setBranches((prev) => [...prev, makeBranch("", "")]);
  }

  function handleDeleteBranch(id: string) {
    setBranches((prev) => {
      if (prev.length <= MIN_BRANCHES) return prev;
      return prev.filter((b) => b.id !== id);
    });
  }

  function updateBranch(
    id: string,
    field: keyof ConditionBranch,
    value: string,
  ) {
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="right" className="w-[400px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <GitBranch className="h-4 w-4 text-violet-400" />
            Configure Condition
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Variable */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Variable</Label>
            <Input
              value={variable}
              onChange={(e) => setVariable(e.target.value)}
              placeholder="e.g. {{role}}"
              className="h-8 text-sm font-mono"
            />
            <p className="text-[10px] text-muted-foreground leading-snug">
              Use <span className="font-mono">{"{{varName}}"}</span> — resolved
              from the last segment of the source JSONPath (e.g.{" "}
              <span className="font-mono">$.user.role</span> → role).
            </p>
          </div>

          {/* Branches */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Branches</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 text-xs px-2"
                onClick={handleAddBranch}
              >
                <Plus className="h-3 w-3" />
                Add branch
              </Button>
            </div>

            <div className="space-y-2">
              {branches.map((branch, idx) => {
                const isElse =
                  !branch.expression.trim() && idx === branches.length - 1;
                return (
                  <div
                    key={branch.id}
                    className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2"
                  >
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <Input
                        value={branch.label}
                        onChange={(e) =>
                          updateBranch(branch.id, "label", e.target.value)
                        }
                        placeholder={
                          isElse ? "else (default)" : "Label (e.g. admin)"
                        }
                        className="h-7 text-xs"
                      />
                      {!isElse && (
                        <Input
                          value={branch.expression}
                          onChange={(e) =>
                            updateBranch(
                              branch.id,
                              "expression",
                              e.target.value,
                            )
                          }
                          placeholder="Expression (e.g. == 'admin')"
                          className="h-7 text-xs font-mono"
                        />
                      )}
                      {isElse && (
                        <p className="text-[10px] text-muted-foreground italic px-0.5">
                          Matches when no other branch does
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBranch(branch.id)}
                      disabled={branches.length <= MIN_BRANCHES}
                      className="mt-0.5 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30 transition-colors"
                      title="Delete branch"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-muted-foreground leading-snug">
              Supported expressions:{" "}
              <span className="font-mono">
                == 'val', != 'val', == num, &gt; num, &lt; num, contains 'val'
              </span>
              . Leave expression empty to mark as the{" "}
              <span className="italic">else</span> branch.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 flex items-center gap-2">
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              onDelete(node.id);
              onClose();
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete node
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
