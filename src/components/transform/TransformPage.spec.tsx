/** @vitest-environment happy-dom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runJs, runJsonPath } from "@/lib/transformRunner";
import { useTransformStore } from "@/stores/useTransformStore";
import { TransformPage } from "./TransformPage";

vi.mock("next/dynamic", () => ({
  default: function mockDynamic() {
    function MockCodeEditor({
      value,
      onChange,
      placeholder,
    }: {
      value: string;
      onChange?: (v: string) => void;
      placeholder?: string;
    }) {
      return (
        <textarea
          data-testid="mock-code-editor"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
      );
    }
    return MockCodeEditor;
  },
}));

vi.mock("@/lib/transformRunner", () => ({
  runJsonPath: vi.fn(),
  runJs: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
  useTransformStore.getState().clear();
});

beforeEach(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

describe("TransformPage", () => {
  it("shows placeholder output until transform runs", async () => {
    vi.mocked(runJsonPath).mockResolvedValue({ output: "99" });

    useTransformStore.setState({
      inputBody: '{"a":1}',
      codeJsonPath: "$.a",
      mode: "jsonpath",
    });

    render(<TransformPage />);

    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(screen.getByText("99")).toBeInTheDocument();
    });
    expect(runJsonPath).toHaveBeenCalled();
  });

  it("displays error from runner in output panel", async () => {
    vi.mocked(runJsonPath).mockResolvedValue({ error: "bad path" });

    useTransformStore.setState({
      inputBody: "{}",
      codeJsonPath: "$",
      mode: "jsonpath",
    });

    render(<TransformPage />);

    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(screen.getByText("bad path")).toBeInTheDocument();
    });
  });

  it("uses runJs when mode is JavaScript", async () => {
    vi.mocked(runJs).mockResolvedValue({ output: "ok-js" });
    vi.mocked(runJsonPath).mockResolvedValue({ output: "skip" });

    useTransformStore.setState({
      inputBody: "{}",
      codeJs: "return response.json",
      codeJsonPath: "$",
      mode: "js",
    });

    render(<TransformPage />);

    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(runJs).toHaveBeenCalled();
    });
  });

  it("clear toolbar control resets store", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    useTransformStore.setState({
      inputBody: "{}",
      codeJsonPath: "$",
      output: "{}",
      error: null,
    });

    const { container } = render(<TransformPage />);

    const eraser = container.querySelector(".lucide-eraser");
    const clearBtn = eraser?.closest("button");
    expect(clearBtn).toBeTruthy();
    expect(clearBtn).not.toBeDisabled();
    await user.click(clearBtn!);

    expect(useTransformStore.getState().inputBody).toBe("");
    expect(useTransformStore.getState().output).toBe(null);
  });
});
