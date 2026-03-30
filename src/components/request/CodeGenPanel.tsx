"use client";

import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { CodeEditorLanguage } from "@/components/request/CodeEditor";
import CodeEditor from "@/components/request/CodeEditor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  generateAxios,
  generateCSharp,
  generateCurl,
  generateFetch,
  generateGo,
  generateJava,
  generatePHP,
  generatePython,
  generateRuby,
  resolveTabStateVars,
} from "@/lib/codeGenerators";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { EnvironmentModel, TabState } from "@/types";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

export type Language =
  | "cURL"
  | "fetch"
  | "axios"
  | "Python"
  | "Go"
  | "Ruby"
  | "Java"
  | "C#"
  | "PHP";

const LANGUAGES: Language[] = [
  "cURL",
  "fetch",
  "axios",
  "Python",
  "Go",
  "Ruby",
  "Java",
  "C#",
  "PHP",
];

const COPY_RESET_DELAY_MS = 1500;

const EDITOR_LANGUAGE_MAP: Record<Language, CodeEditorLanguage> = {
  cURL: "text",
  fetch: "javascript",
  axios: "javascript",
  Python: "python",
  Go: "go",
  Ruby: "ruby",
  Java: "java",
  "C#": "csharp",
  PHP: "php",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidLanguage(lang: string): lang is Language {
  return (LANGUAGES as string[]).includes(lang);
}

function generateSnippet(tab: TabState, lang: Language): string {
  switch (lang) {
    case "cURL":
      return generateCurl(tab);
    case "fetch":
      return generateFetch(tab);
    case "axios":
      return generateAxios(tab);
    case "Python":
      return generatePython(tab);
    case "Go":
      return generateGo(tab);
    case "Ruby":
      return generateRuby(tab);
    case "Java":
      return generateJava(tab);
    case "C#":
      return generateCSharp(tab);
    case "PHP":
      return generatePHP(tab);
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type CopyButtonProps = {
  onCopy: () => void;
  copied: boolean;
};

function CopyButton({ onCopy, copied }: CopyButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
      onClick={onCopy}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-green-500">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>Copy</span>
        </>
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type CodeGenPanelProps = {
  tab: TabState;
};

export function CodeGenPanel({ tab }: CodeGenPanelProps) {
  const { showCodeGen, codeGenLang, setSetting } = useSettingsStore();
  const { environments, activeEnvId } = useEnvironmentsStore();

  const persistedLang = isValidLanguage(codeGenLang) ? codeGenLang : "cURL";
  const [activeLang, setActiveLang] = useState<Language>(persistedLang);
  const [resolveVars, setResolveVars] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeEnv: EnvironmentModel | null =
    environments.find((e) => e.id === activeEnvId) ?? null;

  const resolvedTab = useMemo(
    () => (resolveVars ? resolveTabStateVars(tab, activeEnv) : tab),
    [resolveVars, tab, activeEnv],
  );

  const snippet = useMemo(
    () => generateSnippet(resolvedTab, activeLang),
    [resolvedTab, activeLang],
  );

  const handleLangChange = useCallback(
    (lang: Language) => {
      setActiveLang(lang);
      setSetting("codeGenLang", lang);
    },
    [setSetting],
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(snippet).catch(() => {
      // Clipboard API may fail in non-secure contexts; silently ignore
    });
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_RESET_DELAY_MS);
  }, [snippet]);

  const isExpanded = showCodeGen;

  return (
    <div className="border-t bg-background">
      {/* Panel header */}
      <div className="flex h-9 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setSetting("showCodeGen", !isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Code
          </button>

          {isExpanded && (
            <Select
              value={activeLang}
              onValueChange={(v) => handleLangChange(v as Language)}
            >
              <SelectTrigger className="h-6 w-24 border-none px-2 text-xs shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang} className="text-xs">
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isExpanded && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Switch
                id="resolve-vars"
                checked={resolveVars}
                onCheckedChange={setResolveVars}
                className="h-4 w-7"
              />
              <Label
                htmlFor="resolve-vars"
                className="cursor-pointer text-xs text-muted-foreground"
              >
                {resolveVars && activeEnv
                  ? `Resolving: ${activeEnv.name}`
                  : "Resolve variables"}
              </Label>
            </div>
            <CopyButton onCopy={handleCopy} copied={copied} />
          </div>
        )}
      </div>

      {/* Code viewer */}
      {isExpanded && (
        <div className="h-48 border-t">
          <CodeEditor
            key={activeLang}
            value={snippet}
            language={EDITOR_LANGUAGE_MAP[activeLang]}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
