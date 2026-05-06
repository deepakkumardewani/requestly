/** @vitest-environment happy-dom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import type { CollectionModel, HistoryEntry, RequestModel } from "@/types";
import { ApiPickerDialog } from "./ApiPickerDialog";

vi.mock("@/lib/idb", () => ({ getDB: () => null }));

const COL: CollectionModel = {
  id: "col-1",
  name: "Main",
  createdAt: 1,
  updatedAt: 1,
};

const request: RequestModel = {
  id: "req-1",
  collectionId: COL.id,
  name: "List users",
  method: "GET",
  url: "https://api.test/users",
  params: [],
  headers: [],
  auth: { type: "none" },
  body: { type: "none", content: "" },
  preScript: "",
  postScript: "",
  createdAt: 1,
  updatedAt: 1,
};

function resetStores() {
  useCollectionsStore.setState({ collections: [], requests: [] });
  useHistoryStore.setState({ entries: [] });
}

describe("ApiPickerDialog", () => {
  beforeEach(() => {
    resetStores();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("calls onAddRequest when a collection request row is clicked", async () => {
    useCollectionsStore.setState({
      collections: [COL],
      requests: [request],
    });
    const onAddRequest = vi.fn();
    const onClose = vi.fn();

    render(
      <ApiPickerDialog
        open
        onClose={onClose}
        onAddRequest={onAddRequest}
        onAddHistoryNode={vi.fn()}
        alreadyAddedIds={new Set()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Add API Request")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("List users"));

    expect(onAddRequest).toHaveBeenCalledWith("req-1");
  });

  it("calls onClose when the dialog requests close", async () => {
    useCollectionsStore.setState({ collections: [COL], requests: [request] });
    const onClose = vi.fn();

    render(
      <ApiPickerDialog
        open
        onClose={onClose}
        onAddRequest={vi.fn()}
        onAddHistoryNode={vi.fn()}
        alreadyAddedIds={new Set()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Add API Request")).toBeTruthy();
    });

    fireEvent.keyDown(screen.getByRole("dialog"), {
      key: "Escape",
      code: "Escape",
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("calls onAddHistoryNode with a chain node when a history row is picked", async () => {
    const tab = {
      tabId: "tab-1",
      requestId: null as string | null,
      name: "H",
      isDirty: false,
      type: "http" as const,
      method: "GET" as const,
      url: "https://hist.example/path",
      headers: [],
      params: [],
      auth: { type: "none" as const },
      body: { type: "none" as const, content: "" },
      preScript: "",
      postScript: "",
    };
    const entry: HistoryEntry = {
      id: "h1",
      method: "GET",
      url: "https://hist.example/path",
      status: 200,
      duration: 10,
      size: 1,
      timestamp: Date.now(),
      request: tab,
      response: {
        status: 200,
        statusText: "OK",
        headers: {},
        body: "",
        duration: 10,
        size: 1,
        url: "https://hist.example/path",
        method: "GET",
        timestamp: Date.now(),
      },
    };

    useHistoryStore.setState({ entries: [entry] });
    const onAddHistoryNode = vi.fn();

    render(
      <ApiPickerDialog
        open
        onClose={vi.fn()}
        onAddRequest={vi.fn()}
        onAddHistoryNode={onAddHistoryNode}
        alreadyAddedIds={new Set()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /^history$/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("tab", { name: /^history$/i }));

    await waitFor(() => {
      expect(screen.getByText("https://hist.example/path")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("https://hist.example/path"));

    expect(onAddHistoryNode).toHaveBeenCalledTimes(1);
    expect(onAddHistoryNode.mock.calls[0][0]).toMatchObject({
      method: "GET",
      url: "https://hist.example/path",
    });
  });
});
