import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

/** ScrollArea uses `getAnimations` in jsdom/happy-dom, which is missing — stub as a simple container. */
vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "mock-scroll-area", className },
      children,
    ),
}));
