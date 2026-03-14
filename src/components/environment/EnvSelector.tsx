"use client";

import Link from "next/link";
import { ChevronDown, Globe, Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";

export function EnvSelector() {
  const { environments, activeEnvId, setActiveEnv } = useEnvironmentsStore();
  const activeEnv = environments.find((e) => e.id === activeEnvId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-8 w-full items-center justify-between rounded-md border border-method-accent/20 bg-method-accent/5 px-2 text-xs hover:bg-method-accent/10"
      >
        <span className="flex items-center gap-1.5 truncate">
          <Globe className="h-3 w-3 shrink-0 text-method-accent" />
          <span className="truncate">
            {activeEnv?.name ?? "No Environment"}
          </span>
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-52">
        <DropdownMenuItem onClick={() => setActiveEnv(null)}>
          <span className="text-muted-foreground">No Environment</span>
        </DropdownMenuItem>

        {environments.length > 0 && <DropdownMenuSeparator />}

        {environments.map((env) => (
          <DropdownMenuItem
            key={env.id}
            onClick={() => setActiveEnv(env.id)}
            className={activeEnvId === env.id ? "font-medium" : ""}
          >
            {env.name}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/environments" />}>
          <Settings2 className="h-3.5 w-3.5" />
          Manage Environments
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
