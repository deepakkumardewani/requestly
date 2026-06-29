import mixpanel from "mixpanel-browser";

const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

export const AnalyticsEvent = {
  REQUEST_SENT: "request_sent",
  COLLECTION_CREATED: "collection_created",
  COLLECTION_DELETED: "collection_deleted",
  ENVIRONMENT_CREATED: "environment_created",
  DATA_IMPORTED: "data_imported",
  DATA_EXPORTED: "data_exported",
  SHARE_LINK_CREATED: "share_link_created",
  WS_CONNECTION_OPENED: "ws_connection_opened",
  CHAIN_EXECUTED: "chain_executed",
  AI_REQUEST_SENT: "ai_request_sent",
  TAB_OPENED: "tab_opened",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

type EventPropsMap = {
  [AnalyticsEvent.REQUEST_SENT]: {
    method: string;
    status: number;
    duration_ms: number;
    type: "http" | "graphql";
  };
  [AnalyticsEvent.COLLECTION_CREATED]: undefined;
  [AnalyticsEvent.COLLECTION_DELETED]: undefined;
  [AnalyticsEvent.ENVIRONMENT_CREATED]: undefined;
  [AnalyticsEvent.DATA_IMPORTED]: { source?: string; format?: string };
  [AnalyticsEvent.DATA_EXPORTED]: { source?: string; format?: string };
  [AnalyticsEvent.SHARE_LINK_CREATED]: undefined;
  [AnalyticsEvent.WS_CONNECTION_OPENED]: {
    type: "websocket" | "socketio";
  };
  [AnalyticsEvent.CHAIN_EXECUTED]: {
    request_count: number;
    node_count: number;
  };
  [AnalyticsEvent.AI_REQUEST_SENT]: { action: string };
  [AnalyticsEvent.TAB_OPENED]: {
    type: "http" | "graphql" | "websocket" | "socketio";
  };
};

function isBrowser() {
  return typeof window !== "undefined";
}

function isReady() {
  return isBrowser() && Boolean(TOKEN);
}

export function initAnalytics(): void {
  if (!isReady()) return;
  mixpanel.init(TOKEN as string, {
    track_pageview: false,
    persistence: "localStorage",
  });
}

export function track<E extends AnalyticsEventName>(
  event: E,
  ...[props]: EventPropsMap[E] extends undefined
    ? [props?: undefined]
    : [props: EventPropsMap[E]]
): void {
  if (!isReady()) return;
  mixpanel.track(event, (props ?? {}) as Record<string, unknown>);
}

export function increment(property: string, by?: number): void {
  if (!isReady()) return;
  mixpanel.people.increment(property, by ?? 1);
}

export function setOnce(props: Record<string, unknown>): void {
  if (!isReady()) return;
  mixpanel.people.set_once(props);
}

export function identify(id: string): void {
  if (!isReady()) return;
  mixpanel.identify(id);
}
