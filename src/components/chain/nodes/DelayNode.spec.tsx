/** @vitest-environment happy-dom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DelayNode } from "./DelayNode";

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Left: "left", Right: "right", Top: "top", Bottom: "bottom" },
}));

describe("DelayNode", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows wait duration when idle", () => {
    render(
      <DelayNode
        data={{
          nodeId: "d1",
          delayMs: 2500,
          state: "idle",
        }}
      />,
    );

    expect(screen.getByText("Wait")).toBeInTheDocument();
    expect(screen.getByText("2500")).toBeInTheDocument();
    expect(screen.getByText("ms")).toBeInTheDocument();
  });
});
