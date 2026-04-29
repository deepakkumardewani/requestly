/** @vitest-environment happy-dom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTabsStore } from "@/stores/useTabsStore";
import type { GraphQLTab, HttpTab, SocketIOTab, WebSocketTab } from "@/types";
import { RequestTabs } from "./RequestTabs";

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn(() => null),
}));

vi.mock("@/components/request/BodyEditor", () => ({
  BodyEditor: () => <div data-testid="mock-body-editor" />,
}));

vi.mock("@/components/request/ScriptEditor", () => ({
  ScriptEditor: () => <div data-testid="mock-script-editor" />,
}));

vi.mock("@/components/request/CodeEditor", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange?: (v: string) => void;
  }) => (
    <textarea
      data-testid="mock-code-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

function resetTabs() {
  useTabsStore.setState({ tabs: [], activeTabId: null });
}

afterEach(() => {
  cleanup();
  resetTabs();
});

describe("RequestTabs", () => {
  beforeEach(() => {
    resetTabs();
  });

  it("routes HTTP tabs to HttpTabs", () => {
    useTabsStore.getState().openTab({ type: "http" });
    const tabId = (useTabsStore.getState().tabs[0] as HttpTab).tabId;

    render(<RequestTabs tabId={tabId} />);

    expect(screen.getByText("Query Params")).toBeInTheDocument();
  });

  it("routes GraphQL tabs to GraphQLTabs", () => {
    useTabsStore.getState().openTab({ type: "graphql" });
    const tabId = (useTabsStore.getState().tabs[0] as GraphQLTab).tabId;

    render(<RequestTabs tabId={tabId} />);

    expect(screen.getByTestId("request-tab-graphql-query")).toBeInTheDocument();
  });

  it("routes WebSocket tabs", () => {
    useTabsStore.getState().openTab({ type: "websocket" });
    const tabId = (useTabsStore.getState().tabs[0] as WebSocketTab).tabId;

    render(<RequestTabs tabId={tabId} />);

    expect(screen.getByTestId("request-tab-ws-messages")).toBeInTheDocument();
  });

  it("routes Socket.IO tabs", () => {
    useTabsStore.getState().openTab({ type: "socketio" });
    const tabId = (useTabsStore.getState().tabs[0] as SocketIOTab).tabId;

    render(<RequestTabs tabId={tabId} />);

    expect(
      screen.getByTestId("request-tab-socketio-messages"),
    ).toBeInTheDocument();
  });
});
