"use client";

import type {
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { autocompletion, startCompletion } from "@codemirror/autocomplete";
import { StreamLanguage } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { Compartment, EditorState, Prec } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { placeholder as cmPlaceholder, EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { useTheme } from "next-themes";
import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";
import {
  buildStructurePathCompletionOptions,
  type StructureCompletionState,
  shouldSuppressStructureCompletion,
} from "@/lib/structureCompletion";

export type CodeEditorLanguage =
  | "json"
  | "javascript"
  | "text"
  | "python"
  | "go"
  | "java"
  | "php"
  | "ruby"
  | "csharp";

type CodeEditorProps = {
  value: string;
  language?: CodeEditorLanguage;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  envVariables?: string[];
  placeholder?: string;
  /** Parent-owned ref; update `.current` without passing new props to refresh completions. */
  structureCompletionRef?: MutableRefObject<StructureCompletionState | null>;
};

export type {
  StructureCompletionMode,
  StructureCompletionState,
} from "@/lib/structureCompletion";

/** Light theme aligned with app `card` / `foreground` tokens */
const lightEditorTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--card)",
    color: "var(--foreground)",
  },
  ".cm-scroller": { backgroundColor: "var(--card)" },
  ".cm-gutters": {
    backgroundColor: "var(--muted)",
    color: "var(--muted-foreground)",
    border: "none",
    borderRight: "1px solid var(--border)",
  },
  ".cm-activeLineGutter": { backgroundColor: "var(--accent)" },
  ".cm-activeLine": { backgroundColor: "var(--accent)" },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "var(--foreground)",
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in oklch, var(--primary) 28%, transparent)",
  },
  ".cm-content": { caretColor: "var(--foreground)" },
});

function themeExtension(isDark: boolean): Extension {
  return isDark ? oneDark : lightEditorTheme;
}

async function loadLanguageExtension(
  lang: CodeEditorLanguage,
): Promise<Extension | readonly Extension[]> {
  switch (lang) {
    case "json": {
      const { json } = await import("@codemirror/lang-json");
      return json();
    }
    case "javascript": {
      const { javascript } = await import("@codemirror/lang-javascript");
      return javascript();
    }
    case "python": {
      const { python } = await import("@codemirror/lang-python");
      return python();
    }
    case "java": {
      const { java } = await import("@codemirror/lang-java");
      return java();
    }
    case "php": {
      const { php } = await import("@codemirror/lang-php");
      return php({ plain: true });
    }
    case "go": {
      const { go } = await import("@codemirror/legacy-modes/mode/go");
      return StreamLanguage.define(go);
    }
    case "ruby": {
      const { ruby } = await import("@codemirror/legacy-modes/mode/ruby");
      return StreamLanguage.define(ruby);
    }
    case "csharp": {
      const { csharp } = await import("@codemirror/legacy-modes/mode/clike");
      return StreamLanguage.define(csharp);
    }
    default:
      return [];
  }
}

export default function CodeEditor({
  value,
  language = "text",
  onChange,
  readOnly = false,
  className,
  envVariables,
  placeholder,
  structureCompletionRef: structureCompletionRefProp,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartmentRef = useRef<Compartment | null>(null);
  if (!themeCompartmentRef.current) {
    themeCompartmentRef.current = new Compartment();
  }

  const placeholderCompartmentRef = useRef<Compartment | null>(null);
  if (!placeholderCompartmentRef.current) {
    placeholderCompartmentRef.current = new Compartment();
  }

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const envVariablesRef = useRef(envVariables ?? []);
  envVariablesRef.current = envVariables ?? [];

  const structureCompletionFallbackRef =
    useRef<StructureCompletionState | null>(null);
  const structureCompletionRef =
    structureCompletionRefProp ?? structureCompletionFallbackRef;

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    let cancelled = false;
    const themeCompartment = themeCompartmentRef.current;
    const placeholderCompartment = placeholderCompartmentRef.current;

    function envCompletionSource(
      context: CompletionContext,
    ): CompletionResult | null {
      const variables = envVariablesRef.current;
      if (variables.length === 0) return null;

      const match = context.matchBefore(/\{\{[\w.]*/);
      if (!match) return null;

      const prefix = match.text.slice(2);
      const filtered = variables.filter((v) =>
        v.toLowerCase().startsWith(prefix.toLowerCase()),
      );
      if (filtered.length === 0) return null;

      return {
        from: match.from + 2,
        options: filtered.map((name) => ({
          label: name,
          apply: `${name}}}`,
          detail: "env variable",
        })),
        validFor: /^[\w.]*$/,
      };
    }

    function structureCompletionSource(
      context: CompletionContext,
    ): CompletionResult | null {
      const completion = structureCompletionRef.current;
      if (!completion || completion.paths.length === 0) return null;

      const line = context.state.doc.lineAt(context.pos);
      const linePrefix = context.state.doc.sliceString(line.from, context.pos);
      if (shouldSuppressStructureCompletion(linePrefix)) return null;

      const match = context.matchBefore(/[\w.[\]*]+$/);
      if (!match) return null;

      const options = buildStructurePathCompletionOptions(
        completion.paths,
        match.text,
      );
      if (options.length === 0) return null;

      return {
        from: match.from,
        to: match.to,
        options,
        validFor: /^[\w.[\]*]*$/,
      };
    }

    (async () => {
      const languageExtension = await loadLanguageExtension(language);
      if (
        cancelled ||
        !containerRef.current ||
        !themeCompartment ||
        !placeholderCompartment
      ) {
        return;
      }

      const initialDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");

      const extensions: Extension[] = [
        basicSetup,
        themeCompartment.of(themeExtension(initialDark)),
        ...(Array.isArray(languageExtension)
          ? [...languageExtension]
          : [languageExtension]),
        Prec.highest(
          autocompletion({
            override: [envCompletionSource, structureCompletionSource],
            activateOnTyping: true,
          }),
        ),
        EditorView.theme({
          "&": { height: "100%", fontSize: "14px" },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "var(--font-geist-mono, monospace)",
          },
        }),
        EditorState.readOnly.of(readOnly),
        placeholderCompartment.of(
          placeholder ? cmPlaceholder(placeholder) : [],
        ),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString());
            const cursor = update.state.selection.main.from;
            const before = update.state.doc.sliceString(
              Math.max(0, cursor - 2),
              cursor,
            );
            if (before === "{{") {
              startCompletion(update.view);
            }
          }
        }),
      ];

      const state = EditorState.create({
        doc: value,
        extensions,
      });

      const view = new EditorView({ state, parent: containerRef.current });
      viewRef.current = view;
    })();

    return () => {
      cancelled = true;
      viewRef.current?.destroy();
      viewRef.current = null;
    };
    // value synced separately — including it here would recreate the editor every keystroke
  }, [language, readOnly]);

  useEffect(() => {
    const view = viewRef.current;
    const comp = themeCompartmentRef.current;
    if (!view || !comp) return;
    view.dispatch({
      effects: comp.reconfigure(themeExtension(isDark)),
    });
  }, [isDark]);

  useEffect(() => {
    const view = viewRef.current;
    const ph = placeholderCompartmentRef.current;
    if (!view || !ph) return;
    view.dispatch({
      effects: ph.reconfigure(placeholder ? cmPlaceholder(placeholder) : []),
    });
  }, [placeholder]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      data-testid="code-editor"
      className={`h-full w-full overflow-hidden ${className ?? ""}`}
    />
  );
}
