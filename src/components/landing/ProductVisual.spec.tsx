/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductVisual } from "./ProductVisual";

function mockReducedMotion(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}

describe("ProductVisual", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders the default GET request", () => {
    mockReducedMotion(false);
    render(<ProductVisual />);
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("GET");
    expect(screen.getByText("200 OK")).toBeInTheDocument();
  });

  it("switches tabs with arrow keys", () => {
    mockReducedMotion(true);
    render(<ProductVisual />);

    const getTab = screen.getByRole("tab", { name: /GET/i });
    getTab.focus();
    fireEvent.keyDown(getTab, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("POST");
  });

  it("switches URL and response when changing tabs", () => {
    mockReducedMotion(true);
    render(<ProductVisual />);

    fireEvent.click(screen.getByRole("tab", { name: /POST/i }));
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("POST");
    expect(screen.getByText("201 Created")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /DELETE/i }));
    expect(screen.getByText("200 OK")).toBeInTheDocument();
  });

  it("cycles through at least three distinct responses on repeated Send clicks", () => {
    mockReducedMotion(true);
    render(<ProductVisual />);
    const send = screen.getByRole("button", { name: "Send" });

    fireEvent.click(send);
    expect(screen.getByText(/"Bob"/)).toBeInTheDocument();

    fireEvent.click(send);
    expect(screen.getByText("404 Not Found")).toBeInTheDocument();

    fireEvent.click(send);
    expect(screen.getByText("[]")).toBeInTheDocument();
  });

  it("shows loading state before revealing the next response", async () => {
    vi.useFakeTimers();
    mockReducedMotion(false);
    render(<ProductVisual />);

    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText(/Sending/)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByText(/"Bob"/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });
});
