/** @vitest-environment happy-dom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useFolderExpandStore } from "@/stores/useFolderExpandStore";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";
import type { CollectionModel, RequestModel } from "@/types";
import { CollectionTree } from "./CollectionTree";

function renderCollectionTree() {
  return render(<CollectionTree />);
}

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function resetStores() {
  useCollectionsStore.setState({ collections: [], requests: [], folders: [] });
  useFolderExpandStore.setState({ collapsedFolderIds: [] });
  useTabsStore.setState({ tabs: [], activeTabId: null });
  useUIStore.setState({
    isCreatingCollection: false,
    envManagerOpen: false,
    envManagerFocusEnvId: null,
  });
}

beforeEach(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  resetStores();
});

afterEach(() => {
  cleanup();
  resetStores();
  vi.clearAllMocks();
});

describe("CollectionTree", () => {
  it("shows empty state when there are no collections", () => {
    renderCollectionTree();
    expect(screen.getByText("No collections yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /new collection/i }),
    ).toBeInTheDocument();
  });

  it("reveals new collection input when New Collection is clicked", async () => {
    const user = userEvent.setup();
    renderCollectionTree();

    await user.click(screen.getByRole("button", { name: /new collection/i }));

    expect(screen.getByTestId("new-collection-name-input")).toBeInTheDocument();
  });

  it("creates a collection when Enter is pressed with a non-empty name", async () => {
    const user = userEvent.setup();
    useUIStore.setState({ isCreatingCollection: true });
    renderCollectionTree();

    const input = screen.getByTestId("new-collection-name-input");
    await user.type(input, "My API{Enter}");

    await waitFor(() => {
      expect(useCollectionsStore.getState().collections).toHaveLength(1);
      expect(useCollectionsStore.getState().collections[0].name).toBe("My API");
    });
    expect(useUIStore.getState().isCreatingCollection).toBe(false);
  });

  it("renders collections with names and request counts", () => {
    const col: CollectionModel = {
      id: "col-1",
      name: "Prod",
      createdAt: 1,
      updatedAt: 1,
    };
    const req: RequestModel = {
      id: "req-1",
      collectionId: "col-1",
      name: "Health",
      method: "GET",
      url: "https://x.test",
      params: [],
      headers: [],
      auth: { type: "none" },
      body: { type: "none", content: "" },
      preScript: "",
      postScript: "",
      createdAt: 1,
      updatedAt: 1,
    };
    useCollectionsStore.setState({ collections: [col], requests: [req] });

    renderCollectionTree();

    expect(screen.getByTestId("collection-name-col-1")).toHaveTextContent(
      "Prod",
    );
    expect(screen.getByTestId("collection-item-col-1")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("expands accordion to show requests or empty hint", async () => {
    const user = userEvent.setup();
    const col: CollectionModel = {
      id: "col-a",
      name: "EmptyCol",
      createdAt: 1,
      updatedAt: 1,
    };
    useCollectionsStore.setState({ collections: [col], requests: [] });

    renderCollectionTree();

    await user.click(screen.getByTestId("collection-name-col-a"));

    expect(await screen.findByText("No requests yet")).toBeInTheDocument();
  });

  it("opens rename flow from collection dropdown and commits on blur", async () => {
    const user = userEvent.setup();
    const col: CollectionModel = {
      id: "col-r",
      name: "RenameMe",
      createdAt: 1,
      updatedAt: 1,
    };
    useCollectionsStore.setState({ collections: [col], requests: [] });

    renderCollectionTree();

    await user.click(screen.getByTestId("collection-more-btn-col-r"));
    await user.click(screen.getByTestId("collection-rename-btn"));

    const renameInput = screen.getByTestId("collection-rename-input");
    fireEvent.change(renameInput, { target: { value: "Renamed" } });
    fireEvent.blur(renameInput);

    await waitFor(() => {
      expect(useCollectionsStore.getState().collections[0].name).toBe(
        "Renamed",
      );
    });
  });

  it("opens delete confirmation from dropdown", async () => {
    const user = userEvent.setup();
    const col: CollectionModel = {
      id: "col-del",
      name: "DeleteMe",
      createdAt: 1,
      updatedAt: 1,
    };
    useCollectionsStore.setState({ collections: [col], requests: [] });

    renderCollectionTree();

    await user.click(screen.getByTestId("collection-more-btn-col-del"));
    await user.click(screen.getByTestId("collection-delete-btn"));

    expect(screen.getByText("Delete Collection")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /yes, delete collection/i }),
    );

    await waitFor(() => {
      expect(useCollectionsStore.getState().collections).toHaveLength(0);
    });
  });
});
