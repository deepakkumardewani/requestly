"use client";

import { CheckCircle2, HelpCircle, Plus, Trash2, XCircle } from "lucide-react";
import { assertionsSummary } from "@/lib/chainAssertions";
import { generateId } from "@/lib/utils";
import { useResponseStore } from "@/stores/useResponseStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { TabState } from "@/types";
import {
  ASSERTION_OPERATOR_LABELS,
  type AssertionOperator,
  type ChainAssertion,
} from "@/types/chain";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const SOURCE_OPTIONS = [
  { value: "status", label: "Status" },
  { value: "header", label: "Header" },
  { value: "jsonpath", label: "JSONPath" },
] as const;

const OPERATORS: AssertionOperator[] = [
  "eq",
  "neq",
  "contains",
  "not_contains",
  "gt",
  "lt",
  "exists",
  "not_exists",
  "matches_regex",
];

const OPERATORS_WITHOUT_VALUE: AssertionOperator[] = ["exists", "not_exists"];

const TEST_EXAMPLES = [
  {
    label: "Check status is 200",
    source: "status",
    operator: "eq",
    value: "200",
  },
  {
    label: "Body contains a key",
    source: "jsonpath",
    sourcePath: "$.id",
    operator: "exists",
    value: "",
  },
  {
    label: "Header present",
    source: "header",
    sourcePath: "content-type",
    operator: "contains",
    value: "json",
  },
];

type AssertionsTabProps = {
  tabId: string;
};

function AssertionRow({
  assertion,
  result,
  onChange,
  onRemove,
}: {
  assertion: ChainAssertion;
  result?: { passed: boolean; actual: string | null };
  onChange: (updated: ChainAssertion) => void;
  onRemove: () => void;
}) {
  const needsPath =
    assertion.source === "jsonpath" || assertion.source === "header";
  const needsValue = !OPERATORS_WITHOUT_VALUE.includes(assertion.operator);

  return (
    <div className="flex items-center gap-2 rounded border border-border bg-card px-3 py-2">
      {/* Pass/fail badge */}
      {result ? (
        result.passed ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className="flex cursor-help items-center border-0 bg-transparent p-0"
              >
                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>
                Actual:{" "}
                <span className="font-mono">{result.actual ?? "null"}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      ) : (
        <div className="h-4 w-4 shrink-0 rounded-full border-2 border-border" />
      )}

      {/* Source selector */}
      <Select
        value={assertion.source}
        onValueChange={(v) =>
          onChange({
            ...assertion,
            source: v as ChainAssertion["source"],
            sourcePath: undefined,
          })
        }
      >
        <SelectTrigger className="h-7 w-28 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SOURCE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Source path (header name or JSONPath) */}
      {needsPath && (
        <Input
          className="h-7 w-36 text-xs font-mono"
          placeholder={
            assertion.source === "jsonpath" ? "$.data.id" : "content-type"
          }
          value={assertion.sourcePath ?? ""}
          onChange={(e) =>
            onChange({ ...assertion, sourcePath: e.target.value })
          }
        />
      )}

      {/* Operator */}
      <Select
        value={assertion.operator}
        onValueChange={(v) =>
          onChange({ ...assertion, operator: v as AssertionOperator })
        }
      >
        <SelectTrigger className="h-7 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((op) => (
            <SelectItem key={op} value={op} className="text-xs">
              {ASSERTION_OPERATOR_LABELS[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Expected value */}
      {needsValue && (
        <Input
          className="h-7 min-w-0 flex-1 text-xs font-mono"
          placeholder="expected value"
          value={assertion.expectedValue ?? ""}
          onChange={(e) =>
            onChange({ ...assertion, expectedValue: e.target.value })
          }
        />
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label="Remove assertion"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function AssertionsTab({ tabId }: AssertionsTabProps) {
  const { tabs, updateTabState } = useTabsStore();
  const { assertionResults } = useResponseStore();

  const tab = tabs.find((t) => t.tabId === tabId);
  if (!tab || tab.type !== "http") return null;

  const assertions = tab.assertions ?? [];
  const results = assertionResults[tabId] ?? [];
  const summary = results.length > 0 ? assertionsSummary(results) : null;

  function getResult(assertionId: string) {
    return results.find((r) => r.assertionId === assertionId);
  }

  function updateAssertions(updated: ChainAssertion[]) {
    updateTabState(tabId, { assertions: updated } as Partial<TabState>);
  }

  function addAssertion() {
    const newAssertion: ChainAssertion = {
      id: generateId(),
      source: "status",
      operator: "eq",
      expectedValue: "200",
      enabled: true,
    };
    updateAssertions([...assertions, newAssertion]);
  }

  function updateAssertion(id: string, updated: ChainAssertion) {
    updateAssertions(assertions.map((a) => (a.id === id ? updated : a)));
  }

  function removeAssertion(id: string) {
    updateAssertions(assertions.filter((a) => a.id !== id));
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-3">
      {/* Summary bar */}
      {summary && (
        <div className="flex items-center gap-2 rounded border border-border bg-muted/50 px-3 py-2 text-xs">
          <span className="font-medium">
            {summary.passed}/{summary.total} passed
          </span>
          {summary.failed > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
              {summary.failed} failed
            </Badge>
          )}
          {summary.failed === 0 && (
            <Badge className="h-5 bg-emerald-500/20 px-1.5 text-[10px] text-emerald-600 hover:bg-emerald-500/20">
              All passed
            </Badge>
          )}
        </div>
      )}

      {/* Assertion rows */}
      <div className="flex flex-col gap-2">
        {assertions.map((assertion) => (
          <AssertionRow
            key={assertion.id}
            assertion={assertion}
            result={getResult(assertion.id)}
            onChange={(updated) => updateAssertion(assertion.id, updated)}
            onRemove={() => removeAssertion(assertion.id)}
          />
        ))}
      </div>

      {/* Add button */}
      <Button
        variant="outline"
        size="sm"
        className="w-fit gap-1.5 text-xs"
        onClick={addAssertion}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Assertion
      </Button>

      {/* Help section */}
      {assertions.length === 0 && (
        <div className="rounded border border-dashed border-border bg-muted/30 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
            What you can test
          </div>
          <div className="space-y-2">
            {TEST_EXAMPLES.map((ex) => (
              <div key={ex.label} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                <span className="text-xs text-muted-foreground">
                  {ex.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/70">
            Assertions run automatically after each request. They never block
            sending.
          </p>
        </div>
      )}
    </div>
  );
}
