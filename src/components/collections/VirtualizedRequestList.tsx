"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { RequestModel } from "@/types";
import { RequestItem } from "./RequestItem";

type VirtualizedRequestListProps = {
  requests: RequestModel[];
  activeRequestId: string | null;
};

// Measured from RequestItem: py-1.5 (12px) + text-sm line-height (~20px) = ~32px
const ITEM_HEIGHT = 32;
// Show at most this many items before enabling scroll within the accordion
const MAX_VISIBLE = 10;

export function VirtualizedRequestList({
  requests,
  activeRequestId,
}: VirtualizedRequestListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: requests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  const containerHeight = Math.min(requests.length, MAX_VISIBLE) * ITEM_HEIGHT;

  return (
    <div
      ref={parentRef}
      style={{ height: containerHeight, overflowY: "auto" }}
      className="space-y-0.5"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const req = requests[virtualItem.index];
          return (
            <div
              key={req.id}
              style={{
                position: "absolute",
                top: virtualItem.start,
                left: 0,
                right: 0,
              }}
            >
              <RequestItem
                request={req}
                isActive={activeRequestId === req.id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
