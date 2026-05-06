/** @vitest-environment happy-dom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResponseData } from "@/types";
import { ValuePickerPopover } from "./ValuePickerPopover";

describe("ValuePickerPopover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("invokes onRunSource when no response and user clicks Run Source", async () => {
    const onRunSource = vi.fn();
    render(
      <ValuePickerPopover
        sourceResponse={undefined}
        onSelect={vi.fn()}
        onRunSource={onRunSource}
      >
        <button type="button">Open picker</button>
      </ValuePickerPopover>,
    );

    fireEvent.click(screen.getByRole("button", { name: /open picker/i }));

    await waitFor(() => {
      expect(screen.getByText(/run the source node first/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /run source/i }));
    expect(onRunSource).toHaveBeenCalled();
  });

  it("calls onSelect with path and resolved value for JSON responses", async () => {
    const onSelect = vi.fn();
    const response: ResponseData = {
      status: 200,
      statusText: "OK",
      headers: {},
      body: '{"id":7}',
      duration: 1,
      size: 1,
      url: "https://x",
      method: "GET",
      timestamp: 1,
    };

    render(
      <ValuePickerPopover sourceResponse={response} onSelect={onSelect}>
        <button type="button">Open</button>
      </ValuePickerPopover>,
    );

    fireEvent.click(screen.getByRole("button", { name: /^open$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /id:/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /id:/i }));

    expect(onSelect).toHaveBeenCalledWith("$.id", "7");
  });
});
