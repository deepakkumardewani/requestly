"use client";

import { Monitor, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MobileDesktopNotice() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col md:hidden"
      data-testid="mobile-layout"
    >
      <div
        className="flex min-h-svh flex-1 flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/35 px-5 py-10"
        role="main"
        aria-labelledby="mobile-desktop-notice-heading"
      >
        <div className="relative w-full max-w-md">
          <div
            className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-primary/25 via-transparent to-method-accent/20 opacity-70 blur-md"
            aria-hidden
          />
          <div className="relative rounded-2xl border border-border/90 bg-card/95 p-8 shadow-lg shadow-black/[0.04] backdrop-blur-sm dark:shadow-black/25">
            <div className="mb-6 flex items-center justify-center gap-3 text-muted-foreground">
              <div className="flex size-12 items-center justify-center rounded-xl border border-border/80 bg-muted/50">
                <Smartphone className="size-6" aria-hidden />
              </div>
              <span className="text-lg text-muted-foreground/80">→</span>
              <div className="flex size-12 items-center justify-center rounded-xl border border-border/80 bg-muted/50">
                <Monitor className="size-6" aria-hidden />
              </div>
            </div>
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="secondary" className="text-[11px] font-semibold">
                Mobile — coming soon
              </Badge>
            </div>
            <h1
              id="mobile-desktop-notice-heading"
              className="text-center text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Best on desktop
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
              Requestr is built for larger screens. For the full API testing
              experience, open this app on a tablet or computer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
