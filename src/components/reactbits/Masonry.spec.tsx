/** @vitest-environment happy-dom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Masonry, type MasonryItem } from "./Masonry";

const ITEMS: MasonryItem[] = [
  { id: "a", img: "/a.png", alt: "alpha shot", width: 800, height: 600 },
  { id: "b", img: "/b.png", alt: "beta shot", width: 800, height: 1000 },
  { id: "c", img: "/c.png", alt: "gamma shot", width: 800, height: 700 },
];

function mockEnv(reduced: boolean, containerWidth = 900) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: q.includes("reduced-motion") ? reduced : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });

  class RO {
    constructor(private cb: ResizeObserverCallback) {}
    observe(el: Element) {
      this.cb(
        [{ contentRect: { width: containerWidth, height: 0 } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", RO);
}

describe("Masonry", () => {
  beforeEach(() => mockEnv(false));
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders an accessible image per item once measured", () => {
    render(<Masonry items={ITEMS} />);
    expect(screen.getByAltText("alpha shot")).toBeInTheDocument();
    expect(screen.getByAltText("beta shot")).toBeInTheDocument();
    expect(screen.getByAltText("gamma shot")).toBeInTheDocument();
  });

  it("still renders images under reduced motion", () => {
    mockEnv(true);
    render(<Masonry items={ITEMS} />);
    expect(screen.getByAltText("alpha shot")).toBeInTheDocument();
  });
});
