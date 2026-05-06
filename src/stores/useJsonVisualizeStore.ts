"use client";

import { create } from "zustand";

export type VisualizeFormat = "json" | "yaml" | "csv";

type JsonVisualizeState = {
  inputBody: string;
  format: VisualizeFormat;
};

type JsonVisualizeActions = {
  setInputBody: (value: string) => void;
  setFormat: (format: VisualizeFormat) => void;
  clear: () => void;
};

const INITIAL_STATE: JsonVisualizeState = {
  inputBody: "",
  format: "json",
};

export const useJsonVisualizeStore = create<
  JsonVisualizeState & JsonVisualizeActions
>((set) => ({
  ...INITIAL_STATE,
  setInputBody: (value) => set({ inputBody: value }),
  setFormat: (format) => set({ format }),
  clear: () => set({ ...INITIAL_STATE }),
}));
