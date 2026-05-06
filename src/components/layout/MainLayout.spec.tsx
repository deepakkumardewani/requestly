/** @vitest-environment happy-dom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTabsStore } from "@/stores/useTabsStore";
import { MainLayout } from "./MainLayout";

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/shareLink", () => ({
  fetchSharePayload: vi.fn(),
}));

vi.mock("@/hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: () => {},
}));

vi.mock("@/hooks/useMethodTheme", () => ({
  useMethodTheme: () => {},
}));

vi.mock("@/hooks/useSaveRequest", () => ({
  useSaveRequest: () => ({ save: vi.fn(), activeTab: null }),
}));

vi.mock("@/hooks/useCloseTabGuard", () => ({
  useCloseTabGuard: () => ({
    handleCloseTab: vi.fn(),
  }),
}));

vi.mock("@/components/common/CommandPalette", () => ({
  CommandPalette: () => <div data-testid="command-palette-mock" />,
}));

vi.mock("./KeyboardShortcutsModal", () => ({
  KeyboardShortcutsModal: () => null,
}));

vi.mock("./LeftPanel", () => ({
  LeftPanel: () => <aside data-testid="left-panel-mock" />,
}));

vi.mock("./RightPanel", () => ({
  RightPanel: () => <div data-testid="right-panel-mock" />,
}));

vi.mock("./MobileDesktopNotice", () => ({
  MobileDesktopNotice: () => null,
}));

beforeEach(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
  useTabsStore.setState({ tabs: [], activeTabId: null });
  vi.clearAllMocks();
});

describe("MainLayout", () => {
  it("renders desktop layout with resizable handle and left / right regions after mount", async () => {
    render(<MainLayout />);
    await waitFor(() => {
      expect(
        document.querySelector('[data-slot="resizable-handle"]'),
      ).toBeTruthy();
    });
    expect(screen.getByTestId("desktop-layout")).toBeInTheDocument();
    expect(screen.getByTestId("left-panel-mock")).toBeInTheDocument();
    expect(screen.getByTestId("right-panel-mock")).toBeInTheDocument();
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "app-main");
  });

  it("mounts command palette for global access", async () => {
    render(<MainLayout />);
    await waitFor(() => {
      expect(screen.getByTestId("command-palette-mock")).toBeInTheDocument();
    });
  });
});
