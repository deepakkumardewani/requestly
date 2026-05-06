/** @vitest-environment happy-dom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NodeContextMenu } from "./NodeContextMenu";

describe("NodeContextMenu", () => {
  afterEach(() => {
    cleanup();
  });

  it("runs callback when choosing Run up to here", async () => {
    const user = userEvent.setup();
    const onRunUpTo = vi.fn();
    const onClose = vi.fn();

    render(
      <NodeContextMenu
        x={100}
        y={100}
        requestId="req-9"
        nodeType="api"
        onClose={onClose}
        onAddAfter={vi.fn()}
        onRunUpTo={onRunUpTo}
        onRunFromHere={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("menuitem", { name: /run up to here/i }));

    expect(onRunUpTo).toHaveBeenCalledWith("req-9");
    expect(onClose).toHaveBeenCalled();
  });
});
