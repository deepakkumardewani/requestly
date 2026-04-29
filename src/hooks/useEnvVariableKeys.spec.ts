/** @vitest-environment happy-dom */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import type { EnvironmentModel, EnvVariable } from "@/types";
import { useEnvVariableKeys } from "./useEnvVariableKeys";

function makeVar(key: string): EnvVariable {
  return {
    id: `var-${key}`,
    key,
    initialValue: "",
    currentValue: "",
    isSecret: false,
  };
}

function makeEnv(
  id: string,
  name: string,
  variables: EnvVariable[],
): EnvironmentModel {
  return {
    id,
    name,
    variables,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("useEnvVariableKeys", () => {
  beforeEach(() => {
    useEnvironmentsStore.setState({ environments: [], activeEnvId: null });
  });

  it("returns empty array when there is no active environment", () => {
    useEnvironmentsStore.setState({
      environments: [makeEnv("e1", "Dev", [makeVar("apiUrl")])],
      activeEnvId: null,
    });

    const { result } = renderHook(() => useEnvVariableKeys());
    expect(result.current).toEqual([]);
  });

  it("returns empty array when activeEnvId does not match any environment", () => {
    useEnvironmentsStore.setState({
      environments: [makeEnv("e1", "Dev", [makeVar("k")])],
      activeEnvId: "missing-id",
    });

    const { result } = renderHook(() => useEnvVariableKeys());
    expect(result.current).toEqual([]);
  });

  it("returns variable keys from the active environment", () => {
    useEnvironmentsStore.setState({
      environments: [
        makeEnv("e1", "Dev", [
          makeVar("baseUrl"),
          makeVar("token"),
          makeVar("timeout"),
        ]),
      ],
      activeEnvId: "e1",
    });

    const { result } = renderHook(() => useEnvVariableKeys());
    expect(result.current).toEqual(["baseUrl", "token", "timeout"]);
  });

  it("updates keys when switching active environment", () => {
    useEnvironmentsStore.setState({
      environments: [
        makeEnv("alpha", "Alpha", [makeVar("a1"), makeVar("a2")]),
        makeEnv("beta", "Beta", [makeVar("bOnly")]),
      ],
      activeEnvId: "alpha",
    });

    const { result, rerender } = renderHook(() => useEnvVariableKeys());
    expect(result.current).toEqual(["a1", "a2"]);

    act(() => {
      useEnvironmentsStore.getState().setActiveEnv("beta");
    });
    rerender();

    expect(result.current).toEqual(["bOnly"]);
  });

  it("reflects empty variables array on active env", () => {
    useEnvironmentsStore.setState({
      environments: [makeEnv("empty", "Empty", [])],
      activeEnvId: "empty",
    });

    const { result } = renderHook(() => useEnvVariableKeys());
    expect(result.current).toEqual([]);
  });
});
