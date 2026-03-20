"use client";

import {
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  Eraser,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { diffJson, formatJson, parseJsonSafe } from "@/lib/jsonDiff";
import { useJsonCompareStore } from "@/stores/useJsonCompareStore";
import { DiffStatsBar } from "./DiffStatsBar";
import { DiffTree } from "./DiffTree";
import { JsonCompareEditor } from "./JsonCompareEditor";

const SESSION_STORAGE_SEED_KEY = "json-compare-seed-left";
const DEBOUNCE_MS = 300;

export function JsonComparePage() {
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed left editor from response panel via sessionStorage
  useEffect(() => {
    const seed = sessionStorage.getItem(SESSION_STORAGE_SEED_KEY);
    if (seed) {
      sessionStorage.removeItem(SESSION_STORAGE_SEED_KEY);
      setLeftInput(seed);
    }
  }, [setLeftInput]);

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

      {/* Stats bar — shown only when diff has changes */}
      {diffResult && <DiffStatsBar stats={diffResult.stats} />}

      {/* Editors — resizable horizontal split */}
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
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

      {/* Diff section — hidden when both editors are empty */}
      {!bothEmpty && (
        <div className="shrink-0 border-t" style={{ maxHeight: "40%" }}>
          {/* Collapsible toggle */}
          <button
            type="button"
            onClick={() => setDiffOpen((v) => !v)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {diffOpen ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            )}
            Diff
            {diffResult && (
              <span className="ml-1 tabular-nums text-[10px] text-muted-foreground">
                (
                {diffResult.stats.added +
                  diffResult.stats.removed +
                  diffResult.stats.changed}{" "}
                changes)
              </span>
            )}
          </button>

          {diffOpen && (
            <div
              className="border-t"
              style={{ maxHeight: 300, overflow: "hidden" }}
            >
              {!diffResult ? (
                <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                  {leftError || rightError
                    ? "Fix JSON errors above to see the diff"
                    : "Waiting for input…"}
                </div>
              ) : (
                <ScrollArea style={{ height: 300 }}>
                  <DiffTree nodes={diffResult.nodes} />
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
