/** @vitest-environment happy-dom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConditionNode } from "./ConditionNode";

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Left: "left", Right: "right", Top: "top", Bottom: "bottom" },
}));

describe("ConditionNode", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders variable label and branch handles", () => {
    render(
      <ConditionNode
        data={{
          nodeId: "n1",
          variable: "{{response.id}}",
          branches: [
            { id: "b1", label: "match", expression: "=== 'a'" },
            { id: "b2", label: "", expression: "" },
          ],
          state: "idle",
        }}
      />,
    );

    expect(screen.getByText("{{response.id}}")).toBeInTheDocument();
    expect(screen.getByText("match")).toBeInTheDocument();
    expect(screen.getByText("else")).toBeInTheDocument();
  });
});
