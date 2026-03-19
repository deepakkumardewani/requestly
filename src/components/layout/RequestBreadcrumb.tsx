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
  tabId: string;
};

export function RequestBreadcrumb({ tabId }: RequestBreadcrumbProps) {
  const tab = useTabsStore((s) => s.tabs.find((t) => t.tabId === tabId));
  const { requests, collections } = useCollectionsStore();

  if (!tab) return null;

  // Unsaved tab — show tab name with a muted "draft" indicator
  if (!tab.requestId) {
    return (
      <div className="border-b border-border bg-sidebar px-3 py-1.5">
        <Breadcrumb>
          <BreadcrumbList className="text-[11px]">
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
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    );
  }

  const request = requests.find((r) => r.id === tab.requestId);
  if (!request) return null;

  const collection = collections.find((c) => c.id === request.collectionId);
  if (!collection) return null;

  return (
    <div className="border-b border-border bg-sidebar px-3 py-1.5">
      <Breadcrumb>
        <BreadcrumbList className="text-[11px]">
          <BreadcrumbItem>
            <span className="max-w-[160px] truncate">{collection.name}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[200px] truncate text-[11px]">
              {request.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
