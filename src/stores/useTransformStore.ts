"use client";

import { create } from "zustand";

export type TransformMode = "jsonpath" | "js";

type TransformState = {
  inputBody: string;
  codeJsonPath: string;
  codeJs: string;
  mode: TransformMode;
  output: string | null;
  error: string | null;
};

type TransformActions = {
  setInputBody: (value: string) => void;
  setCode: (value: string) => void;
  setMode: (mode: TransformMode) => void;
  setResult: (output: string | null, error: string | null) => void;
  clear: () => void;
};

const INITIAL_STATE: TransformState = {
  inputBody: "",
  codeJsonPath: "",
  codeJs: "",
  mode: "jsonpath",
  output: null,
  error: null,
};

export const useTransformStore = create<TransformState & TransformActions>(
  (set) => ({
    ...INITIAL_STATE,

    setInputBody: (value) => set({ inputBody: value }),
    setCode: (value) =>
      set((state) =>
        state.mode === "js" ? { codeJs: value } : { codeJsonPath: value },
      ),
    setMode: (mode) => set({ mode }),
    setResult: (output, error) => set({ output, error }),
    clear: () => set({ ...INITIAL_STATE }),
  }),
);
