/** @vitest-environment happy-dom */

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SparklineChart } from "./SparklineChart";

afterEach(() => {
  cleanup();
});

describe("SparklineChart", () => {
  it("returns null for empty values", () => {
    const { container: c } = render(
      <SparklineChart values={[]} width={40} height={16} color="#fff" />,
    );
    expect(c.firstChild).toBeNull();
  });

  it("renders polyline for non-empty values", () => {
    const { container: c } = render(
      <SparklineChart values={[1, 3, 2]} width={40} height={20} color="#f00" />,
    );
    const poly = c.querySelector("polyline");
    expect(poly).toBeTruthy();
    expect(poly?.getAttribute("points")).toContain(",");
  });

  it("handles flat series without NaN", () => {
    const { container: c } = render(
      <SparklineChart values={[5, 5, 5]} width={10} height={10} color="#000" />,
    );
    const pts = c.querySelector("polyline")?.getAttribute("points") ?? "";
    expect(pts.split(" ").length).toBe(3);
  });
});
