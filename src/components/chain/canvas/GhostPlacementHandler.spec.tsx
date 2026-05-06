/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GhostPlacementHandler } from "./GhostPlacementHandler";

const screenToFlowPosition = vi.fn(() => ({ x: 42, y: 43 }));

vi.mock("@xyflow/react", () => ({
  useReactFlow: () => ({ screenToFlowPosition }),
}));

describe("GhostPlacementHandler", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("places a delay node when pane receives click", () => {
    const onUpsertDelayNode = vi.fn();
    const onUpsertConditionNode = vi.fn();
    const onUpsertDisplayNode = vi.fn();
    const onUpdateNodePosition = vi.fn();
    const onOpenConditionPanel = vi.fn();
    const onClearPending = vi.fn();

    render(
      <GhostPlacementHandler
        pendingNodeType="delay"
        cursorPos={{ x: 12, y: 34 }}
        onUpsertDelayNode={onUpsertDelayNode}
        onUpsertConditionNode={onUpsertConditionNode}
        onUpsertDisplayNode={onUpsertDisplayNode}
        onUpdateNodePosition={onUpdateNodePosition}
        onOpenConditionPanel={onOpenConditionPanel}
        onClearPending={onClearPending}
      />,
    );

    const pane = document.createElement("div");
    pane.className = "react-flow__pane";
    document.body.appendChild(pane);

    fireEvent.click(pane);

    expect(onUpsertDelayNode).toHaveBeenCalledWith(
      expect.objectContaining({ type: "delay", delayMs: 1000 }),
    );
    expect(onUpdateNodePosition).toHaveBeenCalledWith(expect.any(String), {
      x: 42,
      y: 43,
    });
    expect(onClearPending).toHaveBeenCalled();
    expect(onUpsertConditionNode).not.toHaveBeenCalled();

    document.body.removeChild(pane);
  });
});
