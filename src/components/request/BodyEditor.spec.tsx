/** @vitest-environment happy-dom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTabsStore } from "@/stores/useTabsStore";
import type { HttpTab } from "@/types";
import { BodyEditor } from "./BodyEditor";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

function resetTabs() {
  useTabsStore.setState({ tabs: [], activeTabId: null });
}

afterEach(() => {
  cleanup();
  resetTabs();
});

describe("BodyEditor", () => {
  beforeEach(() => {
    resetTabs();
  });

  it("body type none shows empty state", () => {
    useTabsStore.getState().openTab({
      type: "http",
      body: { type: "none", content: "" },
    });
    const tabId = (useTabsStore.getState().tabs[0] as HttpTab).tabId;

    render(<BodyEditor tabId={tabId} />);

    expect(screen.getByText(/no body for this request/i)).toBeInTheDocument();
  });

  it("switching to JSON shows code editor and updates content", async () => {
    useTabsStore.getState().openTab({
      type: "http",
      body: { type: "none", content: "" },
    });
    const tabId = (useTabsStore.getState().tabs[0] as HttpTab).tabId;

    const user = userEvent.setup();
    render(<BodyEditor tabId={tabId} />);

    await user.click(screen.getByTestId("body-type-selector"));
    await user.click(await screen.findByRole("option", { name: /^JSON$/i }));

    await waitFor(
      () => {
        expect(screen.getByTestId("code-editor")).toBeInTheDocument();
      },
      { timeout: 12_000 },
    );

    const t = useTabsStore.getState().tabs[0] as HttpTab;
    expect(t.body.type).toBe("json");
  }, 15_000);

  it("form-data shows KV table and commits draft row", async () => {
    useTabsStore.getState().openTab({
      type: "http",
      body: { type: "json", content: "{}", formData: [] },
    });
    const tabId = (useTabsStore.getState().tabs[0] as HttpTab).tabId;

    const user = userEvent.setup();
    render(<BodyEditor tabId={tabId} />);

    await user.click(screen.getByTestId("body-type-selector"));
    await user.click(await screen.findByRole("option", { name: /Form Data/i }));

    await waitFor(() =>
      expect(screen.getByTestId("draft-row-key")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByTestId("draft-row-key"), {
      target: { value: "field" },
    });
    fireEvent.change(screen.getByTestId("draft-row-value"), {
      target: { value: "value" },
    });
    fireEvent.blur(screen.getByTestId("draft-row-value"));

    await waitFor(() => {
      const t = useTabsStore.getState().tabs[0] as HttpTab;
      expect(t.body.formData?.length).toBeGreaterThan(0);
      expect(t.body.formData?.some((r) => r.key === "field")).toBe(true);
    });
  });
});
