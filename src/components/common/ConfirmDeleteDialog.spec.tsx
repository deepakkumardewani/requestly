/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

afterEach(() => {
  cleanup();
});

describe("ConfirmDeleteDialog", () => {
  it("calls onConfirm when destructive action clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDeleteDialog
        open
        onOpenChange={vi.fn()}
        title="Delete?"
        description="Cannot undo."
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
