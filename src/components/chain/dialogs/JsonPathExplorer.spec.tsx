/** @vitest-environment happy-dom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JsonPathExplorer } from "./JsonPathExplorer";

describe("JsonPathExplorer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("calls onSelect with JSONPath when a primitive leaf is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <JsonPathExplorer
        data={{ user: { id: 99 }, token: "abc" }}
        onSelect={onSelect}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/token:/)).toBeTruthy();
    });

    const leaf = screen
      .getByRole("button", { name: /token:/i })
      .closest("button");
    expect(leaf).toBeTruthy();
    fireEvent.click(leaf as HTMLButtonElement);

    expect(onSelect).toHaveBeenCalledWith("$.token");
  });

  it("shows empty message for an empty object", () => {
    const { container } = render(
      <JsonPathExplorer data={{}} onSelect={vi.fn()} />,
    );
    expect(container.textContent).toMatch(/empty/i);
  });
});
