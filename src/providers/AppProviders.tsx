"use client";

import { useCronitor } from "@cronitorio/cronitor-rum-nextjs";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useThemeAccent } from "@/hooks/useThemeAccent";
import { identify, initAnalytics, setOnce } from "@/lib/analytics";
import { getAnonUserId } from "@/lib/anonUser";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTabsStore } from "@/stores/useTabsStore";
import enMessages from "../../messages/en";
import frMessages from "../../messages/fr";
import jaMessages from "../../messages/ja";

const MESSAGES = {
  en: enMessages,
  fr: frMessages,
  ja: jaMessages,
} as const;

function LocaleWrapper({ children }: { children: React.ReactNode }) {
  const locale = useSettingsStore((s) => s.locale);
  return (
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}

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

function ThemeAccentApplier() {
  useThemeAccent();
  return null;
}

function CronitorTracker() {
  useCronitor("b6ec34d37802f3167d0bdd1e5faafe29");
  return null;
}

function MixpanelTracker() {
  useEffect(() => {
    initAnalytics();
    const userId = getAnonUserId();
    if (userId) {
      identify(userId);
      setOnce({ first_seen: new Date().toISOString(), platform: "web" });
    }
  }, []);

  return null;
}

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider delay={300}>
        <LocaleWrapper>
          <Suspense fallback={null}>
            <CronitorTracker />
            <MixpanelTracker />
          </Suspense>
          <StoreHydrator />
          <ThemeAccentApplier />
          <Toaster richColors position="bottom-right" />
          {children}
        </LocaleWrapper>
      </TooltipProvider>
    </ThemeProvider>
  );
}
