import { type IDBPDatabase, openDB } from "idb";
import type {
  AppSettings,
  CollectionModel,
  EnvironmentModel,
  HistoryEntry,
  RequestModel,
  TabState,
} from "@/types";
import type { ChainConfig } from "@/types/chain";
import { IDB_DB_NAME } from "./constants";

const IDB_VERSION = 3;

type RequestlyDB = {
  collections: {
    key: string;
    value: CollectionModel;
  };
  requests: {
    key: string;
    value: RequestModel;
    indexes: { "by-collection": string };
  };
  environments: {
    key: string;
    value: EnvironmentModel;
  };
  history: {
    key: string;
    value: HistoryEntry;
    indexes: { "by-timestamp": number };
  };
  tabs: {
    key: string;
    value: TabState;
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  chainConfigs: {
    key: string;
    value: ChainConfig;
  };
};

let dbPromise: Promise<IDBPDatabase<RequestlyDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<RequestlyDB>> | null {
  if (typeof window === "undefined") return null;

  if (!dbPromise) {
    dbPromise = openDB<RequestlyDB>(IDB_DB_NAME, IDB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("collections")) {
          db.createObjectStore("collections", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("requests")) {
          const requestsStore = db.createObjectStore("requests", {
            keyPath: "id",
          });
          requestsStore.createIndex("by-collection", "collectionId");
        }

        if (!db.objectStoreNames.contains("environments")) {
          db.createObjectStore("environments", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("history")) {
          const historyStore = db.createObjectStore("history", {
            keyPath: "id",
          });
          historyStore.createIndex("by-timestamp", "timestamp");
        }

        if (!db.objectStoreNames.contains("tabs")) {
          db.createObjectStore("tabs", { keyPath: "tabId" });
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }

        if (!db.objectStoreNames.contains("chainConfigs")) {
          db.createObjectStore("chainConfigs", { keyPath: "collectionId" });
        }
      },
    });
  }

  return dbPromise;
}
