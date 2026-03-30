"use client";

import type {
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { autocompletion, startCompletion } from "@codemirror/autocomplete";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { StreamLanguage } from "@codemirror/language";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import { go } from "@codemirror/legacy-modes/mode/go";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { EditorState, Prec } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { placeholder as cmPlaceholder } from "@codemirror/view";
import { basicSetup, EditorView } from "codemirror";
import { useEffect, useRef } from "react";

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
};

export default function CodeEditor({
  value,
  language = "text",
  onChange,
  readOnly = false,
  className,
  envVariables,
  placeholder,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Ref so the completion source always reads latest variables
  // without needing to tear down and recreate the editor on every render.
  const envVariablesRef = useRef(envVariables ?? []);
  envVariablesRef.current = envVariables ?? [];

  useEffect(() => {
    if (!containerRef.current) return;

    const languageExtension = (() => {
      switch (language) {
        case "json":
          return json();
        case "javascript":
          return javascript();
        case "python":
          return python();
        case "java":
          return java();
        case "php":
          return php({ plain: true });
        case "go":
          return StreamLanguage.define(go);
        case "ruby":
          return StreamLanguage.define(ruby);
        case "csharp":
          return StreamLanguage.define(csharp);
        default:
          return [];
      }
    })();

    // Reads from ref so it's always current — no need to recreate the editor.
    function envCompletionSource(
      context: CompletionContext,
    ): CompletionResult | null {
      const variables = envVariablesRef.current;
      if (variables.length === 0) return null;

      const match = context.matchBefore(/\{\{[\w.]*/);
      if (!match) return null;

      const prefix = match.text.slice(2); // strip {{
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

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        oneDark,
        ...(Array.isArray(languageExtension)
          ? languageExtension
          : [languageExtension]),
        // Prec.highest ensures our config wins over basicSetup's autocompletion()
        Prec.highest(
          autocompletion({
            override: [envCompletionSource],
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
        ...(placeholder ? [cmPlaceholder(placeholder)] : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString());

            // { is not a word char so activateOnTyping won't fire automatically.
            // Detect {{ and explicitly open the completion popup.
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
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // envVariables intentionally excluded — updates flow through envVariablesRef
    // value intentionally excluded — synced without editor teardown via the effect below
  }, [language, readOnly, placeholder]);

  // Sync external value changes without losing cursor position
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
      className={`h-full w-full overflow-hidden ${className ?? ""}`}
    />
  );
}
