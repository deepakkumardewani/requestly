"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useTabsStore } from "@/stores/useTabsStore";

/** Matches Send styling in `UrlBar` (HTTP / GraphQL). */
const CONNECT_BTN_CLASS =
  "h-8 min-w-[80px] gap-1.5 bg-theme-accent text-[#0d1117] text-xs font-semibold hover:bg-theme-accent/90";

type ConnectButtonProps = {
  tabId: string;
  type: "websocket" | "socketio";
};

export function ConnectButton({ tabId, type }: ConnectButtonProps) {
  const { tabs } = useTabsStore();
  const resolveVariables = useEnvironmentsStore((s) => s.resolveVariables);
  const { connections, connect, disconnect } = useConnectionStore();
  const tab = tabs.find((t) => t.tabId === tabId);
  const conn = connections[tabId] ?? {
    isConnected: false,
    isConnecting: false,
    error: null,
  };

  if (!tab) return null;

  const url = resolveVariables(tab.url.trim());

  function handleConnect() {
    if (!url) return;
    connect(tabId, url, type);
  }

  if (conn.isConnected) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="h-8"
        onClick={() => disconnect(tabId)}
        data-testid="disconnect-btn"
      >
        Disconnect
      </Button>
    );
  }

  if (conn.isConnecting) {
    return (
      <Button
        type="button"
        variant="default"
        size="sm"
        className={CONNECT_BTN_CLASS}
        disabled
        data-testid="connect-btn"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Connecting…
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      className={CONNECT_BTN_CLASS}
      onClick={handleConnect}
      disabled={!url}
      data-testid="connect-btn"
    >
      Connect
    </Button>
  );
}
