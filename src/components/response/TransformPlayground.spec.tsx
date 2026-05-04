/** @vitest-environment happy-dom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePlaygroundStore } from "@/stores/usePlaygroundStore";

const mockRun = vi.fn();
vi.mock("@/hooks/useAI", () => ({
  useAI: vi.fn(() => ({
    run: mockRun,
    loading: false,
    error: null,
    reset: vi.fn(),
  })),
}));

vi.mock("@/components/request/CodeEditor", () => ({
  default: ({ value, onChange }: { value: string; onChange?: (v: string) => void }) => (
    <textarea data-testid="code-editor" value={value} onChange={(e) => onChange?.(e.target.value)} />
  ),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { TransformPlayground } from "./TransformPlayground";

const TAB_ID = "tab-tp-1";

const DEFAULT_PROPS = {
  tabId: TAB_ID,
  responseBody: JSON.stringify({ id: 1, name: "Alice", email: "alice@example.com" }),
  responseStatus: 200,
  responseHeaders: { "content-type": "application/json" },
};

function resetStore() {
  usePlaygroundStore.setState({ playgrounds: {} });
}

afterEach(() => {
  cleanup();
  resetStore();
  vi.clearAllMocks();
});

async function openPlayground() {
  const user = userEvent.setup();
  const toggleBtn = screen.getByRole("button", { name: /transform/i });
  await user.click(toggleBtn);
  return user;
}

describe("TransformPlayground — AI JSONPath Helper", () => {
  beforeEach(() => resetStore());

  it("Ask AI button is absent when mode is JS", async () => {
    render(<TransformPlayground {...DEFAULT_PROPS} />);
    const user = await openPlayground();

    // Switch to JS mode
    await user.click(screen.getByRole("button", { name: "JavaScript" }));
    expect(screen.queryByTestId("jsonpath-ai-btn")).not.toBeInTheDocument();
  });

  it("Ask AI button is absent when no response", async () => {
    render(<TransformPlayground {...DEFAULT_PROPS} responseBody={null} />);
    await openPlayground();
    expect(screen.queryByTestId("jsonpath-ai-btn")).not.toBeInTheDocument();
  });

  it("Ask AI button is present in JSONPath mode with response", async () => {
    render(<TransformPlayground {...DEFAULT_PROPS} />);
    await openPlayground();
    expect(screen.getByTestId("jsonpath-ai-btn")).toBeInTheDocument();
  });

  it("clicking Ask AI button shows the prompt bar", async () => {
    render(<TransformPlayground {...DEFAULT_PROPS} />);
    const user = await openPlayground();

    await user.click(screen.getByTestId("jsonpath-ai-btn"));
    expect(screen.getByTestId("jsonpath-ai-bar")).toBeInTheDocument();
    expect(screen.getByTestId("jsonpath-ai-input")).toBeInTheDocument();
  });

  it("clicking ✕ closes the prompt bar without calling AI", async () => {
    render(<TransformPlayground {...DEFAULT_PROPS} />);
    const user = await openPlayground();

    await user.click(screen.getByTestId("jsonpath-ai-btn"));
    await user.click(screen.getByTestId("jsonpath-ai-close-btn"));

    expect(screen.queryByTestId("jsonpath-ai-bar")).not.toBeInTheDocument();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("submitting prompt calls AI and sets code via setCode", async () => {
    mockRun.mockResolvedValueOnce({ expression: "$.email" });
    render(<TransformPlayground {...DEFAULT_PROPS} />);
    const user = await openPlayground();

    await user.click(screen.getByTestId("jsonpath-ai-btn"));
    await user.type(screen.getByTestId("jsonpath-ai-input"), "email of the user");
    await user.click(screen.getByTestId("jsonpath-ai-generate-btn"));

    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({ description: "email of the user" }),
    );

    await waitFor(() => {
      const pg = usePlaygroundStore.getState().getPlayground(TAB_ID);
      expect(pg.code).toBe("$.email");
    });

    // bar closes after success
    expect(screen.queryByTestId("jsonpath-ai-bar")).not.toBeInTheDocument();
  });
});
