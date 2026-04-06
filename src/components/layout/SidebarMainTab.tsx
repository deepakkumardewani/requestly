"use client";

import { Globe2, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useUIStore } from "@/stores/useUIStore";

function EnvSidebarList() {
  const { environments, activeEnvId, setActiveEnv, createEnv } =
    useEnvironmentsStore();
  const { setEnvManagerOpen, isCreatingEnv, setIsCreatingEnv } = useUIStore();
  const [newEnvName, setNewEnvName] = useState("");
  const newEnvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCreatingEnv) return;
    const timer = setTimeout(() => newEnvInputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [isCreatingEnv]);

  return (
    <div className="space-y-0.5 py-1">
      {isCreatingEnv && (
        <div className="px-2 pb-1">
          <Input
            ref={newEnvInputRef}
            className="h-7 text-xs"
            value={newEnvName}
            placeholder="Environment name"
            onChange={(e) => setNewEnvName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newEnvName.trim()) {
                createEnv(newEnvName.trim());
                setNewEnvName("");
                setIsCreatingEnv(false);
              }
              if (e.key === "Escape") {
                setNewEnvName("");
                setIsCreatingEnv(false);
              }
            }}
            onBlur={() => {
              setNewEnvName("");
              setIsCreatingEnv(false);
            }}
          />
        </div>
      )}

      {environments.length === 0 && !isCreatingEnv ? (
        <div className="px-2 py-4">
          <EmptyState
            title="No environments"
            description="Create an environment to manage variables"
          />
        </div>
      ) : (
        environments.map((env) => (
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
        ))
      )}
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
  const {
    setIsCreatingCollection,
    setIsCreatingEnv,
    isCreatingCollection,
    isCreatingEnv,
  } = useUIStore();

  const [openSections, setOpenSections] = useState<string[]>([
    "collections",
    "environments",
    "chains",
  ]);

  // Auto-expand the relevant section when creation is triggered externally
  useEffect(() => {
    if (isCreatingCollection) {
      setOpenSections((prev) =>
        prev.includes("collections") ? prev : [...prev, "collections"],
      );
    }
  }, [isCreatingCollection]);

  useEffect(() => {
    if (isCreatingEnv) {
      setOpenSections((prev) =>
        prev.includes("environments") ? prev : [...prev, "environments"],
      );
    }
  }, [isCreatingEnv]);

  useEffect(() => {
    if (isCreatingChain) {
      setOpenSections((prev) =>
        prev.includes("chains") ? prev : [...prev, "chains"],
      );
    }
  }, [isCreatingChain]);

  return (
    <ScrollArea className="h-full">
      <Accordion
        multiple
        value={openSections}
        onValueChange={setOpenSections}
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
              className="ml-auto h-5 w-5 opacity-0 transition-opacity group-hover/accordion-trigger:opacity-100"
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
              className="ml-auto h-5 w-5 opacity-0 transition-opacity group-hover/accordion-trigger:opacity-100"
              aria-label="Add environment"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatingEnv(true);
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
              className="ml-auto h-5 w-5 opacity-0 transition-opacity group-hover/accordion-trigger:opacity-100"
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
