/** @vitest-environment happy-dom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useJsonCompareStore } from "@/stores/useJsonCompareStore";
import { JsonComparePage } from "./JsonComparePage";

vi.mock("next/navigation", () => ({
  usePathname: () => "/json-compare",
}));

vi.mock("./JsonCompareEditor", () => ({
  JsonCompareEditor: ({
    label,
    value,
    onChange,
    error,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error: string | null;
  }) => (
    <div>
      <span>{label}</span>
      <textarea
        data-testid={`editor-${label}`}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <span data-testid={`editor-err-${label}`}>{error}</span> : null}
    </div>
  ),
}));

vi.mock("./DiffTree", () => ({
  DiffTree: ({ nodes }: { nodes: unknown[] }) => (
    <div data-testid="diff-tree">{nodes.length} nodes</div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  useJsonCompareStore.getState().clear();
  sessionStorage.clear();
});

beforeEach(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

describe("JsonComparePage", () => {
  it("disables swap and clear when both sides empty", () => {
    render(<JsonComparePage />);

    expect(screen.getByRole("button", { name: /swap/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /clear/i })).toBeDisabled();
  });

  it("computes diff after debounce when both inputs valid JSON", async () => {
    render(<JsonComparePage />);

    fireEvent.change(screen.getByTestId("editor-Left / Base"), {
      target: { value: '{"a":1}' },
    });
    fireEvent.change(screen.getByTestId("editor-Right / Compare"), {
      target: { value: '{"a":2}' },
    });

    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(screen.getByTestId("diff-tree")).toBeInTheDocument();
    });
  });

  it("shows no differences when JSON values match", async () => {
    render(<JsonComparePage />);

    fireEvent.change(screen.getByTestId("editor-Left / Base"), {
      target: { value: '{"x":1}' },
    });
    fireEvent.change(screen.getByTestId("editor-Right / Compare"), {
      target: { value: '{"x":1}' },
    });

    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(
        screen.getByText(/No differences — both JSON values match/i),
      ).toBeInTheDocument();
    });
  });

  it("shows JSON error state and blocks diff", async () => {
    render(<JsonComparePage />);

    fireEvent.change(screen.getByTestId("editor-Left / Base"), {
      target: { value: "{" },
    });
    fireEvent.change(screen.getByTestId("editor-Right / Compare"), {
      target: { value: "{}" },
    });

    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(
        screen.getByText(/Fix JSON errors in the editors/i),
      ).toBeInTheDocument();
    });
  });

  it("swap exchanges left and right in store", () => {
    useJsonCompareStore.setState({
      leftInput: "1",
      rightInput: "2",
    });

    render(<JsonComparePage />);

    fireEvent.click(screen.getByRole("button", { name: /swap/i }));

    expect(useJsonCompareStore.getState().leftInput).toBe("2");
    expect(useJsonCompareStore.getState().rightInput).toBe("1");
  });

  it("seeds left editor from sessionStorage on mount", async () => {
    sessionStorage.setItem("json-compare-seed-left", '{"seeded":true}');

    render(<JsonComparePage />);

    await waitFor(() => {
      expect(useJsonCompareStore.getState().leftInput).toContain("seeded");
    });
    expect(sessionStorage.getItem("json-compare-seed-left")).toBe(null);
  });
});
