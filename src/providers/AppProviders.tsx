"use client";

import { useCronitor } from "@cronitorio/cronitor-rum-nextjs";
import { ThemeProvider } from "next-themes";
import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTabsStore } from "@/stores/useTabsStore";

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
        <Toaster richColors position="bottom-right" />
        {children}
      </TooltipProvider>
    </ThemeProvider>
  );
}
