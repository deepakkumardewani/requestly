/** @vitest-environment happy-dom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorExplainer } from "./ErrorExplainer";

afterEach(() => {
  cleanup();
});

describe("ErrorExplainer", () => {
  it("renders children only when status is below 400", () => {
    render(
      <ErrorExplainer status={200} body="" responseKey={1}>
        <span>OK</span>
      </ErrorExplainer>,
    );

    expect(screen.queryByTestId("error-explainer")).not.toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("opens popover with explanation title after hover", async () => {
    const user = userEvent.setup();

    render(
      <ErrorExplainer status={404} body="" responseKey={1}>
        <span>Not found</span>
      </ErrorExplainer>,
    );

    await user.hover(screen.getByTestId("error-explainer-trigger"));

    expect(
      await screen.findByTestId("error-explainer-title"),
    ).toHaveTextContent("Why did this fail?");
    expect(screen.getByText("404 Not Found")).toBeInTheDocument();
  });

  it("shows matched body-pattern hints", async () => {
    const user = userEvent.setup();

    render(
      <ErrorExplainer
        status={401}
        body='{"error":"invalid_token"}'
        responseKey={1}
      >
        <span>Auth</span>
      </ErrorExplainer>,
    );

    await user.hover(screen.getByTestId("error-explainer-trigger"));

    expect(
      await screen.findByText(
        /The token format is incorrect — check the expected format/i,
      ),
    ).toBeInTheDocument();
  });

  it("dismiss hides explainer until responseKey changes", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <ErrorExplainer status={403} body="" responseKey={1}>
        <span>X</span>
      </ErrorExplainer>,
    );

    await user.hover(screen.getByTestId("error-explainer-trigger"));
    await screen.findByTestId("error-explainer-content");

    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    await waitFor(() => {
      expect(screen.queryByTestId("error-explainer")).not.toBeInTheDocument();
    });

    rerender(
      <ErrorExplainer status={403} body="" responseKey={2}>
        <span>X</span>
      </ErrorExplainer>,
    );

    expect(screen.getByTestId("error-explainer")).toBeInTheDocument();
  });
});
