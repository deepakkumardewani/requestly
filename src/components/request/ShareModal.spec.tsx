/** @vitest-environment happy-dom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HttpTab } from "@/types";
import { ShareModal } from "./ShareModal";

vi.mock("@/lib/anonUser", () => ({
  getAnonUserId: () => "anon-test",
}));

const createShareLink = vi.fn();

vi.mock("@/lib/shareLink", () => ({
  createShareLink: (...args: unknown[]) => createShareLink(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function sampleHttpTab(overrides: Partial<HttpTab> = {}): HttpTab {
  return {
    tabId: "t1",
    requestId: null,
    name: "R",
    isDirty: false,
    type: "http",
    url: "https://api.example.com",
    method: "GET",
    headers: [],
    params: [],
    auth: { type: "none" },
    body: { type: "none", content: "" },
    preScript: "",
    postScript: "",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ShareModal", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("creates share URL when open and copy uses clipboard", async () => {
    createShareLink.mockResolvedValue({
      ok: true,
      url: "https://share.test/l/abc",
    });

    const onOpenChange = vi.fn();
    render(
      <ShareModal open onOpenChange={onOpenChange} tab={sampleHttpTab()} />,
    );

    await waitFor(() => expect(createShareLink).toHaveBeenCalled());

    const copyBtn = await screen.findByRole("button", { name: /copy/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://share.test/l/abc",
      );
      expect(vi.mocked(toast.success)).toHaveBeenCalled();
    });
  });

  it("shows rate limit message when create returns rate_limited", async () => {
    createShareLink.mockResolvedValue({
      ok: false,
      error: "rate_limited",
      resetAt: Date.now() + 3_600_000,
    });

    render(<ShareModal open onOpenChange={vi.fn()} tab={sampleHttpTab()} />);

    expect(await screen.findByText(/share limit/i)).toBeInTheDocument();
  });

  it("close control calls onOpenChange(false)", async () => {
    createShareLink.mockResolvedValue({ ok: true, url: "https://x.test/y" });

    const onOpenChange = vi.fn();
    render(
      <ShareModal open onOpenChange={onOpenChange} tab={sampleHttpTab()} />,
    );

    await screen.findByRole("button", { name: /copy/i });
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
  });
});
