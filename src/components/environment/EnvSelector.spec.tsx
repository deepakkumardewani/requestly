/** @vitest-environment happy-dom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useUIStore } from "@/stores/useUIStore";
import type { EnvironmentModel } from "@/types";
import { EnvSelector } from "./EnvSelector";

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function resetStores() {
  useEnvironmentsStore.setState({ environments: [], activeEnvId: null });
  useUIStore.setState({
    envManagerOpen: false,
    envManagerFocusEnvId: null,
  });
}

beforeEach(() => {
  resetStores();
});

afterEach(() => {
  cleanup();
  resetStores();
  vi.clearAllMocks();
});

describe("EnvSelector", () => {
  it("shows No Environment when none is active", () => {
    useEnvironmentsStore.setState({
      environments: [
        {
          id: "e1",
          name: "Prod",
          variables: [],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      activeEnvId: null,
    });

    render(<EnvSelector />);

    expect(screen.getByTestId("env-selector-trigger")).toHaveTextContent(
      "No Environment",
    );
  });

  it("shows active environment name on trigger", () => {
    const env: EnvironmentModel = {
      id: "e-act",
      name: "Staging",
      variables: [],
      createdAt: 1,
      updatedAt: 1,
    };
    useEnvironmentsStore.setState({
      environments: [env],
      activeEnvId: "e-act",
    });

    render(<EnvSelector />);

    expect(screen.getByTestId("env-selector-trigger")).toHaveTextContent(
      "Staging",
    );
  });

  it("clears active env when No Environment is chosen", async () => {
    const user = userEvent.setup();
    useEnvironmentsStore.setState({
      environments: [
        {
          id: "e-clear",
          name: "Prod",
          variables: [],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      activeEnvId: "e-clear",
    });

    render(<EnvSelector />);

    await user.click(screen.getByTestId("env-selector-trigger"));
    await user.click(screen.getByTestId("env-selector-no-env"));

    expect(useEnvironmentsStore.getState().activeEnvId).toBeNull();
  });

  it("opens manage dialog when Manage Environments is clicked", async () => {
    const user = userEvent.setup();
    useEnvironmentsStore.setState({
      environments: [
        {
          id: "m1",
          name: "Dev",
          variables: [],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      activeEnvId: "m1",
    });

    render(<EnvSelector />);

    await user.click(screen.getByTestId("env-selector-trigger"));
    await user.click(screen.getByTestId("env-selector-manage-btn"));

    await waitFor(() => {
      expect(useUIStore.getState().envManagerOpen).toBe(true);
    });
  });

  it("activates environment when selecting from menu", async () => {
    const user = userEvent.setup();
    useEnvironmentsStore.setState({
      environments: [
        {
          id: "ea",
          name: "Alpha",
          variables: [],
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: "eb",
          name: "Beta",
          variables: [],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      activeEnvId: "ea",
    });

    render(<EnvSelector />);

    await user.click(screen.getByTestId("env-selector-trigger"));
    await user.click(screen.getByTestId("env-selector-item-Beta"));

    expect(useEnvironmentsStore.getState().activeEnvId).toBe("eb");
  });
});
