/** @vitest-environment happy-dom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConditionNodeConfig } from "@/types/chain";
import { ConditionConfigPanel } from "./ConditionConfigPanel";

describe("ConditionConfigPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("returns null when node is missing even if open", () => {
    const { container } = render(
      <ConditionConfigPanel
        open
        node={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container.textContent).toBe("");
  });

  it("renders branch editor and variable field for a condition node", async () => {
    const node: ConditionNodeConfig = {
      id: "cond-1",
      type: "condition",
      variable: "{{role}}",
      branches: [
        { id: "b1", label: "admin", expression: "== 'admin'" },
        { id: "b2", label: "else", expression: "" },
      ],
    };

    render(
      <ConditionConfigPanel
        open
        node={node}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/configure condition/i)).toBeTruthy();
    });

    const variableInput = screen.getByDisplayValue("{{role}}");
    expect(variableInput).toBeTruthy();
    expect(screen.getByDisplayValue("admin")).toBeTruthy();
  });

  it("calls onSave with updated variable when Save is clicked", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const node: ConditionNodeConfig = {
      id: "cond-1",
      type: "condition",
      variable: "x",
      branches: [{ id: "b1", label: "a", expression: "== '1'" }],
    };

    render(
      <ConditionConfigPanel
        open
        node={node}
        onClose={onClose}
        onSave={onSave}
        onDelete={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("x")).toBeTruthy();
    });

    fireEvent.change(screen.getByDisplayValue("x"), {
      target: { value: "{{newVar}}" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ variable: "{{newVar}}", id: "cond-1" }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("adds a branch when Add branch is clicked", async () => {
    const node: ConditionNodeConfig = {
      id: "cond-1",
      type: "condition",
      variable: "",
      branches: [{ id: "b1", label: "only", expression: "== 'a'" }],
    };

    render(
      <ConditionConfigPanel
        open
        node={node}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add branch/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /add branch/i }));

    expect(screen.getAllByTitle("Delete branch").length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it("calls onDelete and onClose when Delete node is clicked", async () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    const node: ConditionNodeConfig = {
      id: "cond-1",
      type: "condition",
      variable: "v",
      branches: [{ id: "b1", label: "a", expression: "" }],
    };

    render(
      <ConditionConfigPanel
        open
        node={node}
        onClose={onClose}
        onSave={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /delete node/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /delete node/i }));

    expect(onDelete).toHaveBeenCalledWith("cond-1");
    expect(onClose).toHaveBeenCalled();
  });
});
