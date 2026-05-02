"use client";

import { create } from "zustand";
import type { RequestError, ResponseData } from "@/types";
import type { AssertionResult } from "@/types/chain";

type ResponseState = {
  responses: Record<string, ResponseData | null>;
  loading: Record<string, boolean>;
  errors: Record<string, RequestError | null>;
  scriptLogs: Record<string, string[]>;
  assertionResults: Record<string, AssertionResult[]>;
  /** Unresolved `{{variable}}` names detected before the last send attempt. Empty = none. */
  unresolvedVars: Record<string, string[]>;
};

type ResponseActions = {
  setResponse: (tabId: string, response: ResponseData) => void;
  clearResponse: (tabId: string) => void;
  setLoading: (tabId: string, loading: boolean) => void;
  setError: (tabId: string, error: RequestError | null) => void;
  setScriptLogs: (tabId: string, logs: string[]) => void;
  setAssertionResults: (tabId: string, results: AssertionResult[]) => void;
  setUnresolvedVars: (tabId: string, vars: string[]) => void;
};

export const useResponseStore = create<ResponseState & ResponseActions>(
  (set) => ({
    responses: {},
    loading: {},
    errors: {},
    scriptLogs: {},
    assertionResults: {},
    unresolvedVars: {},

    setResponse(tabId, response) {
      set((state) => ({
        responses: { ...state.responses, [tabId]: response },
        loading: { ...state.loading, [tabId]: false },
        errors: { ...state.errors, [tabId]: null },
      }));
    },

    clearResponse(tabId) {
      set((state) => ({
        responses: { ...state.responses, [tabId]: null },
        loading: { ...state.loading, [tabId]: false },
        errors: { ...state.errors, [tabId]: null },
        scriptLogs: { ...state.scriptLogs, [tabId]: [] },
        assertionResults: { ...state.assertionResults, [tabId]: [] },
        unresolvedVars: { ...state.unresolvedVars, [tabId]: [] },
      }));
    },

    setLoading(tabId, loading) {
      set((state) => ({
        loading: { ...state.loading, [tabId]: loading },
        errors: { ...state.errors, [tabId]: null },
        // Only wipe transient state when a new request STARTS, not when it finishes.
        // Wiping on false would erase unresolvedVars that were just set before the
        // loading flag is lowered (banner would never render).
        ...(loading
          ? {
              scriptLogs: { ...state.scriptLogs, [tabId]: [] },
              assertionResults: { ...state.assertionResults, [tabId]: [] },
              unresolvedVars: { ...state.unresolvedVars, [tabId]: [] },
            }
          : {}),
      }));
    },

    setError(tabId, error) {
      set((state) => ({
        errors: { ...state.errors, [tabId]: error },
        loading: { ...state.loading, [tabId]: false },
      }));
    },

    setScriptLogs(tabId, logs) {
      set((state) => ({
        scriptLogs: { ...state.scriptLogs, [tabId]: logs },
      }));
    },

    setAssertionResults(tabId, results) {
      set((state) => ({
        assertionResults: { ...state.assertionResults, [tabId]: results },
      }));
    },

    setUnresolvedVars(tabId, vars) {
      set((state) => ({
        unresolvedVars: { ...state.unresolvedVars, [tabId]: vars },
      }));
    },
  }),
);
