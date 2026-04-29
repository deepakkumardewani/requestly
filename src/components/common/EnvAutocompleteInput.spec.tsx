/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EnvAutocompleteInput } from "./EnvAutocompleteInput";

vi.mock("@/hooks/useEnvVariableKeys", () => ({
  useEnvVariableKeys: () => ["API_KEY", "API_URL", "OTHER"],
}));

function ControlledEnvInput() {
  const [value, setValue] = useState("");
  return (
    <EnvAutocompleteInput
      value={value}
      onChange={(e) => setValue(e.target.value)}
      aria-label="env"
    />
  );
}

afterEach(() => {
  cleanup();
});

describe("EnvAutocompleteInput", () => {
  it("shows suggestions when typing after {{", () => {
    const onChange = vi.fn();
    render(
      <EnvAutocompleteInput value="" onChange={onChange} aria-label="env" />,
    );

    const input = screen.getByLabelText("env");
    fireEvent.change(input, { target: { value: "prefix {{API" } });

    expect(screen.getByText("API_KEY")).toBeInTheDocument();
    expect(screen.getByText("API_URL")).toBeInTheDocument();
  });

  it("completes first matching variable on Enter after typing", async () => {
    const user = userEvent.setup();

    render(<ControlledEnvInput />);

    const input = screen.getByLabelText("env");
    await user.type(input, "x {{{{API");

    expect(await screen.findByText("API_KEY")).toBeInTheDocument();

    await user.keyboard("{Enter}");

    expect(input).toHaveValue("x {{API_KEY}}");
  });
});
