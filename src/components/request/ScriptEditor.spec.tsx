/** @vitest-environment happy-dom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useResponseStore } from "@/stores/useResponseStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { HttpTab } from "@/types";
import { ScriptEditor } from "./ScriptEditor";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

vi.mock("./CodeEditor", () => ({
  default: ({ value }: { value: string }) => (
    <div data-testid="code-editor">{value}</div>
  ),
}));

const mockCheckSyntax = vi.fn((_code: string) => ({ ok: true as const }));
vi.mock("@/lib/scriptLinter", () => ({
  checkSyntax: (code: string) => mockCheckSyntax(code),
}));

const mockAIRun = vi.fn();
vi.mock("@/hooks/useAI", () => ({
  useAI: vi.fn(() => ({
    run: mockAIRun,
    loading: false,
    error: null,
    reset: vi.fn(),
  })),
}));

function resetStores() {
  useTabsStore.setState({ tabs: [], activeTabId: null });
  useResponseStore.setState({ responses: {}, loading: {}, errors: {}, scriptLogs: {}, assertionResults: {}, unresolvedVars: {} });
}

function openHttpTab(overrides: Partial<HttpTab> = {}) {
  useTabsStore.getState().openTab({ type: "http", ...overrides });
  return (useTabsStore.getState().tabs[0] as HttpTab).tabId;
}

afterEach(() => {
  cleanup();
  resetStores();
  vi.clearAllMocks();
});

describe("ScriptEditor", () => {
  beforeEach(() => {
    resetStores();
  });

  it("renders 'Ask AI' and 'Check Syntax' buttons", () => {
    const tabId = openHttpTab();
    render(<ScriptEditor tabId={tabId} />);

    expect(screen.getByTestId("ask-ai-btn")).toBeInTheDocument();
    expect(screen.getByTestId("check-syntax-btn")).toBeInTheDocument();
  });

  it("clicking 'Ask AI' shows the inline prompt bar", async () => {
    const tabId = openHttpTab();
    const user = userEvent.setup();
    render(<ScriptEditor tabId={tabId} />);

    await user.click(screen.getByTestId("ask-ai-btn"));
    expect(screen.getByTestId("ai-script-bar")).toBeInTheDocument();
  });

  it("clicking ✕ closes the bar without calling /api/ai", async () => {
    const tabId = openHttpTab();
    const user = userEvent.setup();
    render(<ScriptEditor tabId={tabId} />);

    await user.click(screen.getByTestId("ask-ai-btn"));
    await user.click(screen.getByTestId("ai-script-close-btn"));

    expect(screen.queryByTestId("ai-script-bar")).not.toBeInTheDocument();
    expect(mockAIRun).not.toHaveBeenCalled();
  });

  it("appends generated code to existing script with \\n\\n separator", async () => {
    const existingScript = "// existing code";
    mockAIRun.mockResolvedValueOnce({ code: "console.log('hello');" });

    const tabId = openHttpTab({ preScript: existingScript });
    const user = userEvent.setup();
    render(<ScriptEditor tabId={tabId} />);

    await user.click(screen.getByTestId("ask-ai-btn"));
    await user.type(screen.getByTestId("ai-script-input"), "log hello");
    await user.click(screen.getByTestId("ai-script-generate-btn"));

    await waitFor(() => {
      const tab = useTabsStore.getState().tabs[0] as HttpTab;
      expect(tab.preScript).toBe("// existing code\n\nconsole.log('hello');");
    });
  });

  it("appends to empty script without leading separator", async () => {
    mockAIRun.mockResolvedValueOnce({ code: "console.log('hello');" });

    const tabId = openHttpTab({ preScript: "" });
    const user = userEvent.setup();
    render(<ScriptEditor tabId={tabId} />);

    await user.click(screen.getByTestId("ask-ai-btn"));
    await user.type(screen.getByTestId("ai-script-input"), "log hello");
    await user.click(screen.getByTestId("ai-script-generate-btn"));

    await waitFor(() => {
      const tab = useTabsStore.getState().tabs[0] as HttpTab;
      expect(tab.preScript).toBe("console.log('hello');");
    });
  });

  it("calls checkSyntax automatically after insertion", async () => {
    mockAIRun.mockResolvedValueOnce({ code: "const x = 1;" });

    const tabId = openHttpTab({ preScript: "" });
    const user = userEvent.setup();
    render(<ScriptEditor tabId={tabId} />);

    await user.click(screen.getByTestId("ask-ai-btn"));
    await user.type(screen.getByTestId("ai-script-input"), "declare x");
    await user.click(screen.getByTestId("ai-script-generate-btn"));

    await waitFor(() => {
      expect(mockCheckSyntax).toHaveBeenCalledWith("const x = 1;");
    });
  });

  it("closes the bar after successful insertion", async () => {
    mockAIRun.mockResolvedValueOnce({ code: "const x = 1;" });

    const tabId = openHttpTab({ preScript: "" });
    const user = userEvent.setup();
    render(<ScriptEditor tabId={tabId} />);

    await user.click(screen.getByTestId("ask-ai-btn"));
    await user.type(screen.getByTestId("ai-script-input"), "declare x");
    await user.click(screen.getByTestId("ai-script-generate-btn"));

    await waitFor(() => {
      expect(screen.queryByTestId("ai-script-bar")).not.toBeInTheDocument();
    });
  });

  it("appends to postScript when post tab is active", async () => {
    mockAIRun.mockResolvedValueOnce({ code: "console.log(rq.response.status);" });

    const tabId = openHttpTab({ postScript: "// existing" });
    const user = userEvent.setup();
    render(<ScriptEditor tabId={tabId} />);

    await user.click(screen.getByTestId("script-tab-post"));
    await user.click(screen.getByTestId("ask-ai-btn"));
    await user.type(screen.getByTestId("ai-script-input"), "log status");
    await user.click(screen.getByTestId("ai-script-generate-btn"));

    await waitFor(() => {
      const tab = useTabsStore.getState().tabs[0] as HttpTab;
      expect(tab.postScript).toBe("// existing\n\nconsole.log(rq.response.status);");
    });
  });
});
