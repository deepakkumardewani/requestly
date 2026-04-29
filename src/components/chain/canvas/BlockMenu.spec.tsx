/** @vitest-environment happy-dom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BlockMenu } from "./BlockMenu";

describe("BlockMenu", () => {
  afterEach(() => {
    cleanup();
  });

  it("opens menu and invokes onAddApiClick for HTTP Request", async () => {
    const user = userEvent.setup();
    const onAddApiClick = vi.fn();
    const onEnterGhostMode = vi.fn();

    render(
      <BlockMenu
        onAddApiClick={onAddApiClick}
        onEnterGhostMode={onEnterGhostMode}
      />,
    );

    await user.click(screen.getByRole("button", { name: /block/i }));

    await user.click(screen.getByRole("button", { name: /HTTP Request/i }));

    expect(onAddApiClick).toHaveBeenCalledTimes(1);
    expect(onEnterGhostMode).not.toHaveBeenCalled();
  });
});
