"use client";

import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";

/** Returns the key names of all variables in the currently active environment. */
export function useEnvVariableKeys(): string[] {
  const activeEnvId = useEnvironmentsStore((s) => s.activeEnvId);
  const environments = useEnvironmentsStore((s) => s.environments);
  const activeEnv = environments.find((e) => e.id === activeEnvId);
  return activeEnv?.variables.map((v) => v.key) ?? [];
}
