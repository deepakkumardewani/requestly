/** @vitest-environment happy-dom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormattedJsonResponseBody } from "./FormattedJsonResponseBody";

describe("FormattedJsonResponseBody", () => {
  afterEach(() => {
    cleanup();
  });

  it("pretty-prints valid JSON", () => {
    render(<FormattedJsonResponseBody body='{"a":1}' />);

    expect(screen.getByText(/"a"/)).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });
});
