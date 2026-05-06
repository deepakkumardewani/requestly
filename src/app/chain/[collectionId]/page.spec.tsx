/** @vitest-environment happy-dom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as chainRunner from "@/lib/chainRunner";
import { useChainStore } from "@/stores/useChainStore";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useStandaloneChainStore } from "@/stores/useStandaloneChainStore";
import type { CollectionModel, RequestModel } from "@/types";
import ChainPage from "./page";

vi.mock("@/lib/idb", () => ({ getDB: () => null }));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/chain/canvas/ChainCanvas", () => ({
  ChainCanvas: (props: Record<string, unknown>) => (
    <div data-testid="chain-canvas-mock">
      <button
        type="button"
        data-testid="mock-open-picker"
        onClick={() => (props.onAddApiClick as () => void)()}
      >
        Open picker
      </button>
      <button
        type="button"
        data-testid="mock-delete-req"
        onClick={() => (props.onDeleteNode as (id: string) => void)("req-1")}
      >
        Delete node
      </button>
      <button
        type="button"
        data-testid="mock-add-edge"
        onClick={() =>
          (props.onUpsertEdge as (e: unknown) => void)({
            id: "edge-1",
            sourceRequestId: "req-1",
            targetRequestId: "req-2",
            injections: [],
          })
        }
      >
        Add edge
      </button>
      <button
        type="button"
        data-testid="mock-delete-edge"
        onClick={() => (props.onDeleteEdge as (id: string) => void)("edge-1")}
      >
        Delete edge
      </button>
      <button
        type="button"
        data-testid="mock-run-up-to"
        onClick={() => (props.onRunUpTo as (id: string) => void)("req-1")}
      >
        Run up to
      </button>
    </div>
  ),
}));

vi.mock("@/components/chain/dialogs/ApiPickerDialog", () => ({
  ApiPickerDialog: ({
    open,
    onAddRequest,
  }: {
    open: boolean;
    onAddRequest: (id: string) => void;
  }) =>
    open ? (
      <div data-testid="api-picker-mock">
        <button
          type="button"
          data-testid="picker-add-req-2"
          onClick={() => onAddRequest("req-2")}
        >
          Pick req 2
        </button>
      </div>
    ) : null,
}));

const COL_ID = "col-1";

const collection: CollectionModel = {
  id: COL_ID,
  name: "Chain collection",
  createdAt: 1,
  updatedAt: 1,
};

const baseRequest = (id: string, name: string): RequestModel => ({
  id,
  collectionId: COL_ID,
  name,
  method: "GET",
  url: "https://chain.test",
  params: [],
  headers: [],
  auth: { type: "none" },
  body: { type: "none", content: "" },
  preScript: "",
  postScript: "",
  createdAt: 1,
  updatedAt: 1,
});

function seedCollectionChain(
  nodeIds: string[],
  edges: {
    id: string;
    sourceRequestId: string;
    targetRequestId: string;
    injections: never[];
  }[] = [],
) {
  useCollectionsStore.setState({
    collections: [collection],
    requests: [baseRequest("req-1", "R1"), baseRequest("req-2", "R2")],
  });
  useChainStore.setState({
    configs: {
      [COL_ID]: {
        collectionId: COL_ID,
        edges,
        nodePositions: {},
        nodeIds,
      },
    },
  });
}

function resetAllStores() {
  useCollectionsStore.setState({ collections: [], requests: [] });
  useChainStore.setState({ configs: {} });
  useHistoryStore.setState({ entries: [] });
  useStandaloneChainStore.setState({ chains: {} });
  useEnvironmentsStore.setState({ environments: [], activeEnvId: null });
}

async function renderChainPage() {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <ChainPage params={Promise.resolve({ collectionId: COL_ID })} />
      </Suspense>,
    );
  });
}

describe("ChainPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(chainRunner, "runChain").mockResolvedValue(undefined);
    resetAllStores();
  });

  afterEach(() => {
    cleanup();
  });

  it("adds a node when the API picker confirms a request", async () => {
    seedCollectionChain(["req-1"]);
    await renderChainPage();

    fireEvent.click(await screen.findByTestId("mock-open-picker"));
    fireEvent.click(screen.getByTestId("picker-add-req-2"));

    await waitFor(() => {
      const ids = useChainStore.getState().configs[COL_ID]?.nodeIds ?? [];
      expect(ids).toContain("req-2");
    });
  });

  it("removes a node from the chain graph when delete is invoked", async () => {
    seedCollectionChain(["req-1"]);
    await renderChainPage();

    fireEvent.click(await screen.findByTestId("mock-delete-req"));

    await waitFor(() => {
      expect(useChainStore.getState().configs[COL_ID]?.nodeIds).toEqual([]);
    });
  });

  it("creates and deletes edges via canvas callbacks", async () => {
    seedCollectionChain(["req-1", "req-2"]);
    await renderChainPage();

    fireEvent.click(await screen.findByTestId("mock-add-edge"));

    await waitFor(() => {
      expect(useChainStore.getState().configs[COL_ID]?.edges).toHaveLength(1);
    });

    fireEvent.click(screen.getByTestId("mock-delete-edge"));

    await waitFor(() => {
      expect(useChainStore.getState().configs[COL_ID]?.edges).toEqual([]);
    });
  });

  it("runs the full chain when Run Chain is clicked", async () => {
    seedCollectionChain(["req-1"]);
    await renderChainPage();

    fireEvent.click(await screen.findByRole("button", { name: /run chain/i }));

    await waitFor(() => {
      expect(chainRunner.runChain).toHaveBeenCalled();
    });
  });

  it("surfaces a circular dependency error from partial run", async () => {
    const { toast } = await import("sonner");
    const spy = vi
      .spyOn(chainRunner, "buildExecutionOrder")
      .mockImplementation(() => {
        throw new chainRunner.CircularDependencyError();
      });

    seedCollectionChain(["req-1", "req-2"]);
    await renderChainPage();

    fireEvent.click(await screen.findByTestId("mock-run-up-to"));

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "This chain has a circular dependency. Remove the cycle to run.",
      );
    });

    spy.mockRestore();
  });
});
