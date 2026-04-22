"use client";

import {
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  Eraser,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  diffJson,
  filterDiffToChangesOnly,
  formatJson,
  parseJsonSafe,
} from "@/lib/jsonDiff";
import { useJsonCompareStore } from "@/stores/useJsonCompareStore";
import { DiffTree } from "./DiffTree";
import { JsonCompareEditor } from "./JsonCompareEditor";

const SESSION_STORAGE_SEED_KEY = "json-compare-seed-left";
const DEBOUNCE_MS = 300;

export function JsonComparePage() {
  const pathname = usePathname();
  const {
    leftInput,
    rightInput,
    leftError,
    rightError,
    diffResult,
    setLeftInput,
    setRightInput,
    setLeftError,
    setRightError,
    setDiffResult,
    swap,
    clear,
  } = useJsonCompareStore();

  const [diffOpen, setDiffOpen] = useState(true);
  const [showFullTree, setShowFullTree] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const changeCount = useMemo(() => {
    if (!diffResult) return 0;
    const { added, removed, changed } = diffResult.stats;
    return added + removed + changed;
  }, [diffResult]);

  const treeNodes = useMemo(() => {
    if (!diffResult) return null;
    return showFullTree
      ? diffResult.nodes
      : filterDiffToChangesOnly(diffResult.nodes);
  }, [diffResult, showFullTree]);

  // Seed / refresh left from sessionStorage (e.g. new tab, or when navigation
  // did not go through a synchronous store update). `pathname` re-runs this
  // when returning to the tool so we do not rely only on mount order.
  useEffect(() => {
    if (pathname !== "/json-compare") return;
    const seed = sessionStorage.getItem(SESSION_STORAGE_SEED_KEY);
    if (!seed) return;
    sessionStorage.removeItem(SESSION_STORAGE_SEED_KEY);
    const trimmed = seed.trim();
    setLeftInput(trimmed === "" ? "" : formatJson(seed));
  }, [pathname, setLeftInput]);

  // Debounced diff execution whenever either input changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const bothEmpty = !leftInput.trim() && !rightInput.trim();
      if (bothEmpty) {
        setLeftError(null);
        setRightError(null);
        setDiffResult(null);
        return;
      }

      const left = parseJsonSafe(leftInput);
      const right = parseJsonSafe(rightInput);

      setLeftError(left.error);
      setRightError(right.error);

      // Only run diff when both sides are valid (or empty)
      if (left.error || right.error) {
        setDiffResult(null);
        return;
      }

      // One side may be empty — treat as null
      const result = diffJson(left.value, right.value);
      setDiffResult(result);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [leftInput, rightInput, setLeftError, setRightError, setDiffResult]);

  function handleFormatLeft() {
    setLeftInput(formatJson(leftInput));
  }

  function handleFormatRight() {
    setRightInput(formatJson(rightInput));
  }

  const bothEmpty = !leftInput.trim() && !rightInput.trim();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={swap}
          disabled={bothEmpty}
          className="gap-1.5"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Swap
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={bothEmpty}
          className="gap-1.5"
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      {/* Editors (top) + structural diff (bottom) — vertical split keeps changes on screen */}
      {!bothEmpty ? (
        <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
          <ResizablePanel defaultSize="62%" minSize="35%">
            <ResizablePanelGroup
              orientation="horizontal"
              className="h-full min-h-0"
            >
              <ResizablePanel defaultSize="50%" minSize="20%">
                <JsonCompareEditor
                  label="Left / Base"
                  value={leftInput}
                  onChange={setLeftInput}
                  error={leftError}
                  onFormat={handleFormatLeft}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize="50%" minSize="20%">
                <JsonCompareEditor
                  label="Right / Compare"
                  value={rightInput}
                  onChange={setRightInput}
                  error={rightError}
                  onFormat={handleFormatRight}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize="38%"
            minSize="18%"
            className="flex min-h-0 flex-col border-t bg-muted/10"
          >
            <button
              type="button"
              onClick={() => setDiffOpen((v) => !v)}
              className="flex w-full shrink-0 items-center gap-2 border-b px-3 py-2 text-left transition-colors hover:bg-muted/40"
            >
              {diffOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">
                  What changed
                </div>
                <div className="text-xs text-muted-foreground">
                  Structural diff — drag the handle above to resize editors vs.
                  summary
                </div>
              </div>
              {diffResult && changeCount > 0 && (
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  {diffResult.stats.added > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {diffResult.stats.added} added
                    </span>
                  )}
                  {diffResult.stats.removed > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] font-medium tabular-nums text-red-600 dark:text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      {diffResult.stats.removed} removed
                    </span>
                  )}
                  {diffResult.stats.changed > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium tabular-nums text-amber-700 dark:text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {diffResult.stats.changed} changed
                    </span>
                  )}
                </div>
              )}
            </button>

            {diffOpen && (
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3 pt-2">
                {!diffResult ? (
                  <div className="flex flex-1 items-center justify-center rounded-md border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
                    {leftError || rightError
                      ? "Fix JSON errors in the editors to see the diff."
                      : "Enter or paste JSON on both sides to compare."}
                  </div>
                ) : changeCount === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-md border border-dashed bg-muted/20 px-3 py-8 text-center text-sm text-muted-foreground">
                    No differences — both JSON values match.
                  </div>
                ) : (
                  <>
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b pb-2">
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        {showFullTree
                          ? "Showing every key (including unchanged). Turn off to list only edits."
                          : "Showing only keys that differ. Turn on to include unchanged context."}
                      </p>
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                        <span className="text-muted-foreground">All keys</span>
                        <Switch
                          size="sm"
                          checked={showFullTree}
                          onCheckedChange={setShowFullTree}
                        />
                      </label>
                    </div>
                    <ScrollArea className="min-h-0 flex-1 rounded-md border bg-card">
                      <DiffTree nodes={treeNodes ?? []} />
                    </ScrollArea>
                  </>
                )}
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-0 flex-1"
        >
          <ResizablePanel defaultSize="50%" minSize="20%">
            <JsonCompareEditor
              label="Left / Base"
              value={leftInput}
              onChange={setLeftInput}
              error={leftError}
              onFormat={handleFormatLeft}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="50%" minSize="20%">
            <JsonCompareEditor
              label="Right / Compare"
              value={rightInput}
              onChange={setRightInput}
              error={rightError}
              onFormat={handleFormatRight}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
