"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useTabsStore } from "@/stores/useTabsStore";

type RequestBreadcrumbProps = {
  tabId: string | null;
};

export function RequestBreadcrumb({ tabId }: RequestBreadcrumbProps) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.tabId === tabId));
  const { requests, collections } = useCollectionsStore();

  const request = tab?.requestId
    ? requests.find((r) => r.id === tab.requestId)
    : undefined;
  const collection = request
    ? collections.find((c) => c.id === request.collectionId)
    : undefined;

  // Always render the container so it occupies the same height and the layout
  // never shifts when switching between tabs.
  return (
    <div className="border-b border-border bg-sidebar px-3 py-1.5">
      <Breadcrumb>
        <BreadcrumbList className="text-[11px]">
          {!tab ? (
            // No active tab — render invisible placeholder to hold space
            <BreadcrumbItem>
              <BreadcrumbPage className="invisible text-[11px]">
                &nbsp;
              </BreadcrumbPage>
            </BreadcrumbItem>
          ) : !tab.requestId ? (
            // Unsaved tab
            <>
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[200px] truncate text-[11px] text-muted-foreground">
                  {tab.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-[10px] italic text-muted-foreground/60">
                  unsaved
                </span>
              </BreadcrumbItem>
            </>
          ) : collection && request ? (
            // Saved tab with known collection
            <>
              <BreadcrumbItem>
                <span className="max-w-[160px] truncate">
                  {collection.name}
                </span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[200px] truncate text-[11px]">
                  {request.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            // Saved tab but collection/request not found — hold space
            <BreadcrumbItem>
              <BreadcrumbPage className="invisible text-[11px]">
                &nbsp;
              </BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
