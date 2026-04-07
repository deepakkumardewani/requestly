"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getImportedSlugs, markSlugImported } from "@/lib/hub";

const IMPORTED_SLUGS_KEY = "requestly_imported_hub_slugs";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): string {
  return localStorage.getItem(IMPORTED_SLUGS_KEY) ?? "[]";
}

function getServerSnapshot(): string {
  return "[]";
}

export function useImportedHubSlugs() {
  // Re-renders when localStorage changes (cross-tab sync is a bonus)
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const importedSlugs = getImportedSlugs();

  const markImported = useCallback((slug: string) => {
    markSlugImported(slug);
    // Trigger re-render in same tab by dispatching a storage event
    window.dispatchEvent(new Event("storage"));
  }, []);

  return { importedSlugs, markImported };
}
