"use client";

import { useTabsStore } from "@/stores/useTabsStore";
import { GraphQLTabs } from "./tabs/GraphQLTabs";
import { HttpTabs } from "./tabs/HttpTabs";
import { SocketIOTabs } from "./tabs/SocketIOTabs";
import { WebSocketTabs } from "./tabs/WebSocketTabs";

type RequestTabsProps = {
  tabId: string;
};

export function RequestTabs({ tabId }: RequestTabsProps) {
  const { tabs } = useTabsStore();
  const tab = tabs.find((t) => t.tabId === tabId);

  if (!tab) return null;

  if (tab.type === "http") return <HttpTabs tabId={tabId} />;
  if (tab.type === "graphql") return <GraphQLTabs tabId={tabId} />;
  if (tab.type === "websocket") return <WebSocketTabs tabId={tabId} />;
  if (tab.type === "socketio") return <SocketIOTabs tabId={tabId} />;

  return null;
}
