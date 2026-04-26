"use client";

import { create } from "zustand";
import { DEFAULT_LANGUAGE } from "@/lib/quicktype";

type DataSchemaState = {
  isOpen: boolean;
  language: string;
  generatedCode: string;
  isGenerating: boolean;
  error: string | null;
};

type DataSchemaActions = {
  open: () => void;
  close: () => void;
  setLanguage: (language: string) => void;
  setGeneratedCode: (code: string) => void;
  setGenerating: (value: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const INITIAL_STATE: DataSchemaState = {
  isOpen: false,
  language: DEFAULT_LANGUAGE,
  generatedCode: "",
  isGenerating: false,
  error: null,
};

export const useDataSchemaStore = create<DataSchemaState & DataSchemaActions>(
  (set) => ({
    ...INITIAL_STATE,

    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    setLanguage: (language) => set({ language }),
    setGeneratedCode: (generatedCode) => set({ generatedCode }),
    setGenerating: (isGenerating) => set({ isGenerating }),
    setError: (error) => set({ error }),
    reset: () => set({ ...INITIAL_STATE }),
  }),
);
