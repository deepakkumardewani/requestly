/** @vitest-environment happy-dom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChainNode } from "./ChainNode";

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Left: "left", Right: "right", Top: "top", Bottom: "bottom" },
}));

describe("ChainNode", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders method, name, and triggers onClickNode when activated", async () => {
    const user = userEvent.setup();
    const onClickNode = vi.fn();

    render(
      <ChainNode
        data={{
          requestId: "req-1",
          name: "Get users",
          method: "GET",
          url: "https://api.example.com/users",
          state: "idle",
          onClickNode,
        }}
      />,
    );

    expect(screen.getByText("GET")).toBeInTheDocument();
    expect(screen.getByText("Get users")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /GET request Get users, run state idle/,
      }),
    );
    expect(onClickNode).toHaveBeenCalledWith("req-1");
  });
});
