/** @vitest-environment happy-dom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestModel } from "@/types";
import { EditRequestPanel } from "./EditRequestPanel";

const COL = "c1";

function baseRequest(overrides: Partial<RequestModel> = {}): RequestModel {
  return {
    id: "r1",
    collectionId: COL,
    name: "My request",
    method: "GET",
    url: "https://api.test/foo?a=1",
    params: [],
    headers: [],
    auth: { type: "none" },
    body: { type: "json", content: "" },
    preScript: "",
    postScript: "",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("EditRequestPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders edit form when open", async () => {
    render(
      <EditRequestPanel
        open
        onClose={vi.fn()}
        request={baseRequest()}
        onSave={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Request")).toBeTruthy();
    });
    expect(screen.getByDisplayValue("My request")).toBeTruthy();
  });

  it("calls onSave and onClose with patched fields when Save is clicked", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <EditRequestPanel
        open
        onClose={onClose}
        request={baseRequest()}
        onSave={onSave}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("My request")).toBeTruthy();
    });

    fireEvent.change(screen.getByDisplayValue("My request"), {
      target: { value: "Renamed" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Renamed", method: "GET" }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("shows body section for POST and passes updated body on save", async () => {
    const onSave = vi.fn();
    render(
      <EditRequestPanel
        open
        onClose={vi.fn()}
        request={baseRequest({
          method: "POST",
          url: "https://api.test/",
          body: { type: "json", content: '{"a":1}' },
        })}
        onSave={onSave}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Request")).toBeTruthy();
    });

    const textarea = await waitFor(() =>
      screen.getByPlaceholderText('{"key": "value"}'),
    );
    fireEvent.change(textarea, { target: { value: '{"b":2}' } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ content: '{"b":2}' }),
      }),
    );
  });

  it("calls onClose when Cancel is clicked without saving", async () => {
    const onClose = vi.fn();
    render(
      <EditRequestPanel
        open
        onClose={onClose}
        request={baseRequest()}
        onSave={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
