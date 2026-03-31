"use client";

import { useRouter } from "next/navigation";
import { MethodBadge } from "@/components/common/MethodBadge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { truncateUrl } from "@/lib/utils";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { collections, requests } = useCollectionsStore();
  const { entries } = useHistoryStore();
  const openTab = useTabsStore((s) => s.openTab);

  const recentHistory = entries.slice(0, 20);

  function handleSelect(action: () => void) {
    setCommandPaletteOpen(false);
    action();
  }

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
    >
      <CommandInput placeholder="Search requests, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleSelect(() => openTab())}>
            New Request
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => router.push("/environments"))}
          >
            Manage Environments
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => router.push("/import"))}
          >
            Import Collection
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => router.push("/settings"))}
          >
            Open Settings
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => router.push("/transform"))}
          >
            Transform Playground
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect(() => router.push("/json-compare"))}
          >
            Compare JSON
          </CommandItem>
        </CommandGroup>

        {/* Collections */}
        {requests.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Collections">
              {requests.slice(0, 30).map((req) => {
                const collection = collections.find(
                  (c) => c.id === req.collectionId,
                );
                return (
                  <CommandItem
                    key={req.id}
                    onSelect={() =>
                      handleSelect(() =>
                        openTab({
                          requestId: req.id,
                          name: req.name,
                          method: req.method,
                          url: req.url,
                          params: req.params,
                          headers: req.headers,
                          auth: req.auth,
                          body: req.body,
                          preScript: req.preScript,
                          postScript: req.postScript,
                        }),
                      )
                    }
                  >
                    <MethodBadge method={req.method} className="mr-2" />
                    <span className="flex-1 truncate">{req.name}</span>
                    {collection && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {collection.name}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {/* History */}
        {recentHistory.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent History">
              {recentHistory.map((entry) => (
                <CommandItem
                  key={entry.id}
                  onSelect={() =>
                    handleSelect(() =>
                      openTab({
                        name: truncateUrl(entry.url, 30),
                        method: entry.method,
                        url: entry.url,
                        params: entry.request.params,
                        headers: entry.request.headers,
                        auth: entry.request.auth,
                        body: entry.request.body,
                      }),
                    )
                  }
                >
                  <MethodBadge method={entry.method} className="mr-2" />
                  <span className="flex-1 truncate font-mono text-xs">
                    {truncateUrl(entry.url, 50)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
