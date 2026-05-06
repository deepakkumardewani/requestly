"use client";

import "jsoncrack-react/style.css";
import type { GraphData, JSONCrackRef, LayoutDirection } from "jsoncrack-react";
import {
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronUp,
  Eraser,
  Home,
  Maximize2,
  Network,
  RotateCw,
  Search,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CodeEditorLanguage } from "@/components/request/CodeEditor";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { formatJson } from "@/lib/jsonDiff";
import {
  useJsonVisualizeStore,
  type VisualizeFormat,
} from "@/stores/useJsonVisualizeStore";

const CodeEditor = dynamic(() => import("@/components/request/CodeEditor"), {
  ssr: false,
});

const JSONCrackViewer = dynamic(
  () => import("jsoncrack-react").then((m) => ({ default: m.JSONCrack })),
  { ssr: false },
);

const FORMATS: VisualizeFormat[] = ["json", "yaml", "csv"];

const EDITOR_LANGUAGE: Record<VisualizeFormat, CodeEditorLanguage> = {
  json: "json",
  yaml: "text",
  csv: "text",
};

const LAYOUT_DIRECTIONS: LayoutDirection[] = ["RIGHT", "DOWN", "LEFT", "UP"];

async function convertToJson(
  input: string,
  format: VisualizeFormat,
): Promise<string> {
  if (format === "json") return input;

  if (format === "yaml") {
    const yaml = await import("js-yaml");
    const parsed = yaml.load(input);
    return JSON.stringify(parsed, null, 2);
  }

  if (format === "csv") {
    const Papa = await import("papaparse");
    const result = Papa.parse(input.trim(), {
      header: true,
      skipEmptyLines: true,
    });
    return JSON.stringify(result.data, null, 2);
  }

  return input;
}

// Replace nested objects/arrays with string placeholders so JSONCrack
// treats them as leaf values and creates no child nodes.
function collapseLeaf(value: unknown): unknown {
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (value !== null && typeof value === "object") {
    const n = Object.keys(value as object).length;
    return n > 0 ? `{${n} keys}` : "{}";
  }
  return value;
}

function collapseToTopLevel(json: string): string {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return JSON.stringify(
        parsed.map((item) =>
          typeof item === "object" && item !== null
            ? Object.fromEntries(
                Object.entries(item as Record<string, unknown>).map(
                  ([k, v]) => [k, collapseLeaf(v)],
                ),
              )
            : item,
        ),
        null,
        2,
      );
    }
    if (typeof parsed === "object" && parsed !== null) {
      return JSON.stringify(
        Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [
            k,
            collapseLeaf(v),
          ]),
        ),
        null,
        2,
      );
    }
    return json;
  } catch {
    return json;
  }
}

export function JsonVisualizePage() {
  const { inputBody, format, setInputBody, setFormat, clear } =
    useJsonVisualizeStore();

  const [visualJson, setVisualJson] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [layoutDirection, setLayoutDirection] =
    useState<LayoutDirection>("RIGHT");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const hasVisualized = useRef(false);
  const crackRef = useRef<JSONCrackRef>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isDark =
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : true;

  const collapsedJson = useMemo(
    () => (visualJson ? collapseToTopLevel(visualJson) : ""),
    [visualJson],
  );

  const matchingNodeIds = useMemo(() => {
    if (!graphData || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return graphData.nodes
      .filter((node) =>
        node.text.some(
          (row) =>
            String(row.key ?? "")
              .toLowerCase()
              .includes(q) ||
            String(row.value ?? "")
              .toLowerCase()
              .includes(q),
        ),
      )
      .map((n) => n.id);
  }, [graphData, searchQuery]);

  const matchCount = matchingNodeIds.length;
  const hasNoMatches = searchQuery.trim().length > 0 && matchCount === 0;

  // Reset match index when query or graph changes
  useEffect(() => {
    setCurrentMatchIdx(0);
  }, [searchQuery, graphData]);

  // Highlight specific rows inside matched nodes via DOM traversal
  useEffect(() => {
    const STYLE_ID = "jsoncrack-search-highlight";
    const ROW_ATTR = "data-jc-hl";

    function clearRowHighlights() {
      document.querySelectorAll(`[${ROW_ATTR}]`).forEach((el) => {
        (el as HTMLElement).style.removeProperty("background");
        el.removeAttribute(ROW_ATTR);
      });
    }

    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }

    clearRowHighlights();

    if (matchingNodeIds.length === 0 || !searchQuery.trim()) {
      styleEl.textContent = "";
      return clearRowHighlights;
    }

    const q = searchQuery.toLowerCase();
    const currentId = matchingNodeIds[currentMatchIdx];

    // Outline node containers — no background fill on the whole card
    const allSelectors = matchingNodeIds
      .map((id) => `[data-id="node-${id}"]`)
      .join(", ");
    styleEl.textContent = `
      ${allSelectors} { outline: 1.5px solid #22c55e; border-radius: 4px; }
      [data-id="node-${currentId}"] { outline: 2px solid #22c55e !important; }
    `;

    // Row-level highlight: walk text nodes, collect row containers, paint them
    const applyRowHighlights = () => {
      clearRowHighlights();
      matchingNodeIds.forEach((id) => {
        const nodeEl = document.querySelector(`[data-id="node-${id}"]`);
        if (!nodeEl) return;
        const isCurrent = id === currentId;

        const walker = document.createTreeWalker(nodeEl, NodeFilter.SHOW_TEXT);
        const rowContainers = new Set<Element>();
        let textNode = walker.nextNode() as Text | null;
        while (textNode) {
          if (textNode.textContent?.toLowerCase().includes(q)) {
            // Step up to a plausible row container (1–2 levels above the text span)
            const span = textNode.parentElement;
            const row = span?.parentElement;
            const container: Element | null | undefined =
              row && row !== nodeEl ? row : span;
            if (
              container &&
              container !== nodeEl &&
              nodeEl.contains(container)
            ) {
              rowContainers.add(container);
            }
          }
          textNode = walker.nextNode() as Text | null;
        }

        rowContainers.forEach((el) => {
          const bg = isCurrent ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.12)";
          (el as HTMLElement).style.setProperty("background", bg, "important");
          el.setAttribute(ROW_ATTR, "true");
        });
      });
    };

    // Defer slightly so JSONCrack finishes its render pass
    const timer = setTimeout(applyRowHighlights, 80);

    return () => {
      clearTimeout(timer);
      if (styleEl) styleEl.textContent = "";
      clearRowHighlights();
    };
  }, [matchingNodeIds, searchQuery, currentMatchIdx]);

  // Reset collapsed + graph state when new visualization is loaded
  useEffect(() => {
    setIsCollapsed(false);
    setGraphData(null);
    setSearchQuery("");
    setShowSearch(false);
  }, [visualJson]);

  // Auto-visualize on initial mount if store has pre-seeded content
  useLayoutEffect(() => {
    if (hasVisualized.current) return;
    if (!inputBody.trim()) return;
    hasVisualized.current = true;
    handleVisualize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVisualize = useCallback(async () => {
    const trimmed = inputBody.trim();
    if (!trimmed) {
      setVisualJson("");
      setParseError(null);
      return;
    }
    try {
      const json = await convertToJson(trimmed, format);
      setVisualJson(json);
      setParseError(null);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Parse error");
    }
  }, [inputBody, format]);

  function handleFormatJson() {
    if (!inputBody.trim() || format !== "json") return;
    const formatted = formatJson(inputBody);
    if (formatted !== inputBody) setInputBody(formatted);
  }

  function handleClear() {
    clear();
    setVisualJson("");
    setParseError(null);
    hasVisualized.current = false;
  }

  function handleRotateLayout() {
    setLayoutDirection((prev: LayoutDirection) => {
      const idx = LAYOUT_DIRECTIONS.indexOf(prev);
      return LAYOUT_DIRECTIONS[(idx + 1) % LAYOUT_DIRECTIONS.length];
    });
  }

  function handleToggleSearch() {
    setShowSearch((prev) => {
      if (!prev) setTimeout(() => searchInputRef.current?.focus(), 0);
      return !prev;
    });
    setSearchQuery("");
  }

  function handlePrevMatch() {
    if (matchCount === 0) return;
    setCurrentMatchIdx((i) => (i - 1 + matchCount) % matchCount);
  }

  function handleNextMatch() {
    if (matchCount === 0) return;
    setCurrentMatchIdx((i) => (i + 1) % matchCount);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Page toolbar */}
      <div className="flex shrink-0 items-center border-b px-3 py-2">
        <div className="flex items-center gap-2 px-2 text-sm font-semibold text-foreground">
          <Network className="h-4 w-4 text-method-accent" />
          JSON Visualize
        </div>
      </div>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        {/* Left: Input */}
        <ResizablePanel defaultSize="40%" minSize="20%" maxSize="70%">
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex min-w-0 items-center justify-between gap-2 border-b bg-muted/20 px-3 py-1.5">
              {/* Format tabs */}
              <div className="flex shrink-0 overflow-hidden rounded-md border text-xs">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`px-3 py-1 capitalize transition-colors ${
                      format === f
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <TooltipIconButton
                  label="Format JSON"
                  onClick={handleFormatJson}
                  disabled={!inputBody.trim() || format !== "json"}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                </TooltipIconButton>
                <TooltipIconButton
                  label="Clear"
                  onClick={handleClear}
                  disabled={!inputBody.trim() && !visualJson}
                >
                  <Eraser className="h-3.5 w-3.5" />
                </TooltipIconButton>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-hidden">
                <CodeEditor
                  value={inputBody}
                  language={EDITOR_LANGUAGE[format]}
                  onChange={setInputBody}
                  placeholder={`Paste your ${format.toUpperCase()} here...`}
                  jsonAutoFormatOnPaste={format === "json"}
                />
              </div>

              <div className="shrink-0 border-t bg-muted/10 px-3 py-2">
                <button
                  type="button"
                  onClick={handleVisualize}
                  disabled={!inputBody.trim()}
                  className="w-full rounded-md bg-method-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Visualize
                </button>
                {parseError && (
                  <p className="mt-1.5 text-[11px] text-destructive">
                    {parseError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: JSONCrack visualization */}
        <ResizablePanel defaultSize="60%" minSize="30%">
          <div className="relative h-full w-full">
            {visualJson ? (
              <>
                <JSONCrackViewer
                  ref={crackRef}
                  json={isCollapsed ? collapsedJson : visualJson}
                  theme={isDark ? "dark" : "light"}
                  showControls={false}
                  layoutDirection={layoutDirection}
                  onParse={setGraphData}
                  className="h-full w-full"
                />

                {/* Stacked bottom-center: search bar + controls toolbar */}
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
                  {/* Search bar — shown when search is active */}
                  {showSearch && (
                    <div className="flex items-center gap-2 rounded-lg border bg-background/95 px-3 py-2 shadow-md backdrop-blur-sm">
                      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search nodes…"
                        className="w-40 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                      />
                      {searchQuery.trim() && (
                        <span
                          className={`shrink-0 text-xs ${hasNoMatches ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {hasNoMatches
                            ? "No matches"
                            : `${currentMatchIdx + 1} / ${matchCount}`}
                        </span>
                      )}
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={handlePrevMatch}
                          disabled={matchCount === 0}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextMatch}
                          disabled={matchCount === 0}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleSearch}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Controls toolbar */}
                  <div className="flex max-w-[90vw] items-center gap-1 overflow-x-auto rounded-lg border bg-background/95 px-2 py-1.5 shadow-md backdrop-blur-sm">
                    <TooltipIconButton
                      label="Center view"
                      onClick={() => crackRef.current?.centerView()}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </TooltipIconButton>
                    <TooltipIconButton
                      label="Zoom out"
                      onClick={() => crackRef.current?.zoomOut()}
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </TooltipIconButton>
                    <TooltipIconButton
                      label="Zoom in"
                      onClick={() => crackRef.current?.zoomIn()}
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </TooltipIconButton>
                    <Separator orientation="vertical" className="mx-0.5 h-4" />
                    <TooltipIconButton
                      label="Focus root node"
                      onClick={() => crackRef.current?.focusFirstNode()}
                    >
                      <Home className="h-3.5 w-3.5" />
                    </TooltipIconButton>
                    <TooltipIconButton
                      label="Search nodes"
                      onClick={handleToggleSearch}
                    >
                      <Search className="h-3.5 w-3.5" />
                    </TooltipIconButton>
                    <TooltipIconButton
                      label={`Rotate layout (${layoutDirection})`}
                      onClick={handleRotateLayout}
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </TooltipIconButton>
                    <TooltipIconButton
                      label={isCollapsed ? "Expand all" : "Collapse all"}
                      onClick={() => setIsCollapsed((v) => !v)}
                    >
                      {isCollapsed ? (
                        <ChevronsUpDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronsDownUp className="h-3.5 w-3.5" />
                      )}
                    </TooltipIconButton>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Paste data on the left and click Visualize
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
