/** @vitest-environment happy-dom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HubTab } from "./HubTab";

const fetchMock = vi.fn();

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

describe("HubTab", () => {
  it("shows skeletons while loading", () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<HubTab />);

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      3,
    );
  });

  it("lists providers after index and meta fetch succeed", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/hub")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ slugs: ["acme"] }),
        });
      }
      if (url.endsWith("/data/hub/acme/meta.json")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              name: "Acme API",
              providerName: "Acme",
              description: "Test hub",
              category: "api",
              logoUrl: "",
              docsUrl: "",
              specUrl: "",
              requestCount: 3,
            }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<HubTab />);

    await waitFor(() => {
      expect(screen.getByText("Acme API")).toBeInTheDocument();
    });
    expect(screen.getByText("3 requests")).toBeInTheDocument();
  });

  it("shows empty state when no slugs resolve", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ slugs: [] }),
    });

    render(<HubTab />);

    await waitFor(() => {
      expect(screen.getByText("No providers")).toBeInTheDocument();
    });
  });

  it("shows error empty state when index fetch fails", async () => {
    fetchMock.mockResolvedValue({ ok: false });

    render(<HubTab />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
  });
});
