"use client";

import { Globe2, Plus } from "lucide-react";

import { ChainList } from "@/components/chain/ChainList";
import { CollectionTree } from "@/components/collections/CollectionTree";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useUIStore } from "@/stores/useUIStore";

function EnvSidebarList() {
  const { environments, activeEnvId, setActiveEnv } = useEnvironmentsStore();
  const { setEnvManagerOpen } = useUIStore();

  if (environments.length === 0) {
    return (
      <div className="px-2 py-4">
        <EmptyState
          title="No environments"
          description="Create an environment to manage variables"
        />
      </div>
    );
  }

  return (
    <div className="space-y-0.5 py-1">
      {environments.map((env) => (
        <button
          key={env.id}
          type="button"
          className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-muted ${
            env.id === activeEnvId ? "text-method-accent" : ""
          }`}
          onClick={() => {
            setActiveEnv(env.id === activeEnvId ? null : env.id);
            setEnvManagerOpen(true, env.id);
          }}
        >
          <Globe2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm">{env.name}</span>
          {env.id === activeEnvId && (
            <span className="ml-auto text-[10px] font-medium text-method-accent">
              active
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

type SidebarMainTabProps = {
  isCreatingChain: boolean;
  onCreatingChainDone: () => void;
  onNewChain: () => void;
};

export function SidebarMainTab({
  isCreatingChain,
  onCreatingChainDone,
  onNewChain,
}: SidebarMainTabProps) {
  const { setIsCreatingCollection, setEnvManagerOpen } = useUIStore();

  return (
    <ScrollArea className="h-full">
      <Accordion
        multiple
        defaultValue={["collections", "environments", "chains"]}
        className="w-full"
      >
        {/* Collections */}
        <AccordionItem value="collections" className="border-b border-border">
          <AccordionTrigger
            chevronLeft
            className="px-3 py-2 hover:no-underline hover:bg-muted/50"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Collections
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto h-5 w-5"
              aria-label="Add collection"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatingCollection(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <div className="pl-3 pr-1">
              <CollectionTree />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Environments */}
        <AccordionItem value="environments" className="border-b border-border">
          <AccordionTrigger
            chevronLeft
            className="px-3 py-2 hover:no-underline hover:bg-muted/50"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Environments
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto h-5 w-5"
              aria-label="Add environment"
              onClick={(e) => {
                e.stopPropagation();
                setEnvManagerOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <div className="pl-3 pr-1">
              <EnvSidebarList />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Chains */}
        <AccordionItem value="chains" className="border-b-0">
          <AccordionTrigger
            chevronLeft
            className="px-3 py-2 hover:no-underline hover:bg-muted/50"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Chains
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto h-5 w-5"
              aria-label="New chain"
              onClick={(e) => {
                e.stopPropagation();
                onNewChain();
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <div className="pl-3 pr-1">
              <ChainList
                isCreating={isCreatingChain}
                onCreatingDone={onCreatingChainDone}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  );
}
