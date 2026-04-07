"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { HubProviderCard } from "@/components/hub/HubProviderCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { HubMeta } from "@/types/hub";

type ProviderEntry = {
  slug: string;
  meta: HubMeta;
};

type LoadState = "loading" | "ready" | "error";

export function HubTab() {
  const [providers, setProviders] = useState<ProviderEntry[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    async function fetchProviders() {
      try {
        const indexRes = await fetch("/api/hub");
        if (!indexRes.ok) throw new Error("Failed to fetch hub index");

        const { slugs } = (await indexRes.json()) as { slugs: string[] };

        const entries = await Promise.all(
          slugs.map(async (slug) => {
            const metaRes = await fetch(`/data/hub/${slug}/meta.json`);
            if (!metaRes.ok) return null;
            const meta = (await metaRes.json()) as HubMeta;
            return { slug, meta };
          }),
        );

        setProviders(entries.filter((e): e is ProviderEntry => e !== null));
        setLoadState("ready");
      } catch {
        setLoadState("error");
      }
    }

    fetchProviders();
  }, []);

  if (loadState === "loading") {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="p-4">
        <EmptyState
          title="Failed to load"
          description="Could not fetch API Hub providers. Please try again."
        />
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="No providers"
          description="No prebuilt collections found in the hub."
        />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-3">
        {providers.map(({ slug, meta }) => (
          <HubProviderCard key={slug} slug={slug} meta={meta} />
        ))}
      </div>
    </ScrollArea>
  );
}
