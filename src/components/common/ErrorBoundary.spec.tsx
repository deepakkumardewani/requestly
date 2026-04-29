/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

let passRender = false;

function MaybeThrow() {
  if (!passRender) throw new Error("boom");
  return <span>ok</span>;
}

afterEach(() => {
  cleanup();
  consoleError.mockClear();
  passRender = false;
});

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    passRender = true;
    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("shows fallback and recovers after Try again when child stops throwing", () => {
    passRender = false;
    render(
      <ErrorBoundary fallbackTitle="Oops">
        <MaybeThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Oops")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();

    passRender = true;
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(screen.getByText("ok")).toBeInTheDocument();
  });
});
