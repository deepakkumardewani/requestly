"use client";

import { useEffect, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTabsStore } from "@/stores/useTabsStore";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useCronitor } from "@cronitorio/cronitor-rum-nextjs";

function StoreHydrator() {
  useEffect(() => {
    useSettingsStore.getState().hydrate();
    useTabsStore.getState().hydrate();
    useCollectionsStore.getState().hydrate();
    useEnvironmentsStore.getState().hydrate();
    useHistoryStore.getState().hydrate();
  }, []);

  return null;
}

function CronitorTracker() {
  useCronitor("b6ec34d37802f3167d0bdd1e5faafe29");
  return null;
}

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider delay={300}>
        <Suspense fallback={null}>
          <CronitorTracker />
        </Suspense>
        <StoreHydrator />
        {children}
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
