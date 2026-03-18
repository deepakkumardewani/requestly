"use client";

import { create } from "zustand";

export type PlaygroundMode = "jsonpath" | "js";

export type PlaygroundState = {
  mode: PlaygroundMode;
  code: string;
  output: string | null;
  error: string | null;
};

const DEFAULT_PLAYGROUND: PlaygroundState = {
  mode: "jsonpath",
  code: "",
  output: null,
  error: null,
};

type PlaygroundStoreState = {
  playgrounds: Record<string, PlaygroundState>;
};

type PlaygroundStoreActions = {
  getPlayground: (tabId: string) => PlaygroundState;
  setMode: (tabId: string, mode: PlaygroundMode) => void;
  setCode: (tabId: string, code: string) => void;
  setResult: (
    tabId: string,
    output: string | null,
    error: string | null,
  ) => void;
  reset: (tabId: string) => void;
};

export const usePlaygroundStore = create<
  PlaygroundStoreState & PlaygroundStoreActions
>((set, get) => ({
  playgrounds: {},

  getPlayground(tabId) {
    return get().playgrounds[tabId] ?? { ...DEFAULT_PLAYGROUND };
  },

  setMode(tabId, mode) {
    set((state) => ({
      playgrounds: {
        ...state.playgrounds,
        [tabId]: {
          ...(state.playgrounds[tabId] ?? DEFAULT_PLAYGROUND),
          mode,
          code: "",
          output: null,
          error: null,
        },
      },
    }));
  },

  setCode(tabId, code) {
    set((state) => ({
      playgrounds: {
        ...state.playgrounds,
        [tabId]: { ...(state.playgrounds[tabId] ?? DEFAULT_PLAYGROUND), code },
      },
    }));
  },

  setResult(tabId, output, error) {
    set((state) => ({
      playgrounds: {
        ...state.playgrounds,
        [tabId]: {
          ...(state.playgrounds[tabId] ?? DEFAULT_PLAYGROUND),
          output,
          error,
        },
      },
    }));
  },

  reset(tabId) {
    set((state) => ({
      playgrounds: {
        ...state.playgrounds,
        [tabId]: { ...DEFAULT_PLAYGROUND },
      },
    }));
  },
}));
