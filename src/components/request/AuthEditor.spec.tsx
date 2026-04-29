/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTabsStore } from "@/stores/useTabsStore";
import type { GraphQLTab, HttpTab } from "@/types";
import { AuthEditor } from "./AuthEditor";

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

describe("AuthEditor", () => {
  beforeEach(() => {
    resetTabs();
  });

  it("switching auth type shows correct fields for HTTP tab", async () => {
    useTabsStore.getState().openTab({ type: "http", auth: { type: "none" } });
    const tabId = (useTabsStore.getState().tabs[0] as HttpTab).tabId;

    const user = userEvent.setup();
    render(<AuthEditor tabId={tabId} />);

    expect(
      screen.getByText(/no authentication will be sent/i),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("auth-type-selector"));
    await user.click(
      await screen.findByRole("option", { name: /Bearer Token/i }),
    );

    const input = await screen.findByTestId("auth-bearer-token");
    fireEvent.change(input, { target: { value: "secret-token" } });

    const t = useTabsStore.getState().tabs[0] as HttpTab;
    expect(t.auth.type).toBe("bearer");
    expect(t.auth.type === "bearer" && t.auth.token).toBe("secret-token");
  });

  it("basic auth updates username and password", async () => {
    useTabsStore.getState().openTab({ type: "http", auth: { type: "none" } });
    const tabId = (useTabsStore.getState().tabs[0] as HttpTab).tabId;

    const user = userEvent.setup();
    render(<AuthEditor tabId={tabId} />);

    await user.click(screen.getByTestId("auth-type-selector"));
    await user.click(
      await screen.findByRole("option", { name: /Basic Auth/i }),
    );

    fireEvent.change(screen.getByTestId("auth-basic-username"), {
      target: { value: "u" },
    });
    fireEvent.change(screen.getByTestId("auth-basic-password"), {
      target: { value: "p" },
    });

    const t = useTabsStore.getState().tabs[0] as HttpTab;
    expect(t.auth.type).toBe("basic");
    if (t.auth.type === "basic") {
      expect(t.auth.username).toBe("u");
      expect(t.auth.password).toBe("p");
    }
  });

  it("api-key auth shows key, value, and add-to selector", async () => {
    useTabsStore.getState().openTab({ type: "http", auth: { type: "none" } });
    const tabId = (useTabsStore.getState().tabs[0] as HttpTab).tabId;

    const user = userEvent.setup();
    render(<AuthEditor tabId={tabId} />);

    await user.click(screen.getByTestId("auth-type-selector"));
    await user.click(await screen.findByRole("option", { name: /API Key/i }));

    fireEvent.change(screen.getByTestId("auth-apikey-name"), {
      target: { value: "X-Key" },
    });

    const t = useTabsStore.getState().tabs[0] as HttpTab;
    expect(t.auth.type).toBe("api-key");
    if (t.auth.type === "api-key") {
      expect(t.auth.key).toBe("X-Key");
    }

    await user.click(screen.getByTestId("auth-apikey-addto"));
    await user.click(
      await screen.findByRole("option", { name: /Query Param/i }),
    );

    const t2 = useTabsStore.getState().tabs[0] as HttpTab;
    expect(t2.auth.type).toBe("api-key");
    if (t2.auth.type === "api-key") {
      expect(t2.auth.addTo).toBe("query");
    }
  });

  it("renders for GraphQL tabs", () => {
    useTabsStore
      .getState()
      .openTab({ type: "graphql", auth: { type: "none" } });
    const tabId = (useTabsStore.getState().tabs[0] as GraphQLTab).tabId;

    render(<AuthEditor tabId={tabId} />);
    expect(screen.getByTestId("auth-type-selector")).toBeInTheDocument();
  });
});
