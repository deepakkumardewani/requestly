"use client";

import { create } from "zustand";
import type { DiffResult } from "@/lib/jsonDiff";

type JsonCompareState = {
  leftInput: string;
  rightInput: string;
  leftError: string | null;
  rightError: string | null;
  diffResult: DiffResult | null;
};

type JsonCompareActions = {
  setLeftInput: (value: string) => void;
  setRightInput: (value: string) => void;
  setLeftError: (error: string | null) => void;
  setRightError: (error: string | null) => void;
  setDiffResult: (result: DiffResult | null) => void;
  swap: () => void;
  clear: () => void;
};

const INITIAL_STATE: JsonCompareState = {
  leftInput: "",
  rightInput: "",
  leftError: null,
  rightError: null,
  diffResult: null,
};

export const useJsonCompareStore = create<
  JsonCompareState & JsonCompareActions
>((set, get) => ({
  ...INITIAL_STATE,

  setLeftInput: (value) => set({ leftInput: value }),
  setRightInput: (value) => set({ rightInput: value }),
  setLeftError: (error) => set({ leftError: error }),
  setRightError: (error) => set({ rightError: error }),
  setDiffResult: (result) => set({ diffResult: result }),

  swap: () => {
    const { leftInput, rightInput } = get();
    set({
      leftInput: rightInput,
      rightInput: leftInput,
      leftError: null,
      rightError: null,
      diffResult: null,
    });
  },

  clear: () => set({ ...INITIAL_STATE }),
}));
