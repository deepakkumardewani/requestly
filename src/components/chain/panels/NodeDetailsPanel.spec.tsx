/** @vitest-environment happy-dom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResponseData } from "@/types";
import type { ChainAssertion } from "@/types/chain";
import { NodeDetailsPanel } from "./NodeDetailsPanel";

describe("NodeDetailsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  const baseProps = {
    open: true,
    onClose: vi.fn(),
    name: "Login",
    method: "POST",
    url: "https://api.test/login",
    state: "idle" as const,
  };

  it("renders request name and shows idle state copy", async () => {
    render(<NodeDetailsPanel {...baseProps} />);

    await waitFor(() => {
      expect(screen.getAllByText("Login").length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/run the chain to see results/i)).toBeTruthy();
  });

  it("shows response status and formatted body on the details tab", async () => {
    const response: ResponseData = {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      body: '{"ok":true}',
      duration: 42,
      size: 10,
      url: "https://api.test/login",
      method: "POST",
      timestamp: 1,
    };

    render(
      <NodeDetailsPanel {...baseProps} state="passed" response={response} />,
    );

    await waitFor(() => {
      expect(screen.getByText("200")).toBeTruthy();
    });
    expect(screen.getByText(/"ok"/)).toBeTruthy();
  });

  it("switches to assertions tab and lists assertions", async () => {
    const assertions: ChainAssertion[] = [
      {
        id: "a1",
        source: "status",
        operator: "eq",
        expectedValue: "200",
        enabled: true,
      },
    ];
    const onAssertionsChange = vi.fn();

    render(
      <NodeDetailsPanel
        {...baseProps}
        assertions={assertions}
        onAssertionsChange={onAssertionsChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /^assertions/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("switch", { name: /enable assertion/i }),
      ).toBeTruthy();
    });
    expect(
      screen.getByRole("switch", { name: /enable assertion/i }),
    ).toBeTruthy();
  });

  it("allows saving edited request body for POST", async () => {
    const onSaveBody = vi.fn();
    render(
      <NodeDetailsPanel
        {...baseProps}
        method="POST"
        bodyContent='{"x":1}'
        onSaveBody={onSaveBody}
      />,
    );

    const textarea = await waitFor(() =>
      screen.getByPlaceholderText('{"key": "value"}'),
    );
    fireEvent.change(textarea, { target: { value: '{"x":2}' } });
    const saveBody = screen.getByRole("button", { name: /save body/i });
    expect((saveBody as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(saveBody);

    expect(onSaveBody).toHaveBeenCalledWith('{"x":2}');
  });
});
