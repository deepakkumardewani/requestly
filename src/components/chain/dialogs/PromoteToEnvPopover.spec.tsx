/** @vitest-environment happy-dom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDB } from "@/lib/idb";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { PromoteToEnvPopover } from "./PromoteToEnvPopover";

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

describe("PromoteToEnvPopover", () => {
  beforeEach(() => {
    vi.mocked(getDB).mockReturnValue(null);
    useEnvironmentsStore.setState({ environments: [], activeEnvId: null });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits onSave with env id and variable name", async () => {
    const env = useEnvironmentsStore.getState().createEnv("Staging");

    const onSave = vi.fn();
    render(
      <PromoteToEnvPopover
        edgeId="edge-1"
        suggestedVarName="token"
        extractedValue="secret"
        onSave={onSave}
        onRemove={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle("Promote to environment variable"));

    await waitFor(() => {
      expect(screen.getByText(/promote to environment variable/i)).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText(/auth_token/i), {
      target: { value: "MY_TOKEN" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith({
      edgeId: "edge-1",
      envId: env.id,
      envVarName: "MY_TOKEN",
    });
  });

  it("shows guidance when no environments exist", async () => {
    render(
      <PromoteToEnvPopover
        edgeId="e1"
        suggestedVarName="x"
        extractedValue="v"
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle("Promote to environment variable"));

    await waitFor(() => {
      expect(screen.getByText(/create an environment first/i)).toBeTruthy();
    });
  });
});
