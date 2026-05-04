"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";

/**
 * Updates CSS variables on <html> to drive the user-selected theme accent color.
 * All Tailwind utilities using `text-theme-accent`, `bg-theme-accent/*`, etc.
 * will automatically reflect the chosen accent color.
 */
export function useThemeAccent() {
  const accentColor = useSettingsStore((s) => s.accentColor);

  useEffect(() => {
    if (!accentColor) return;
    const { r, g, b } = accentColor;
    const root = document.documentElement;
    root.style.setProperty("--theme-accent-r", String(r));
    root.style.setProperty("--theme-accent-g", String(g));
    root.style.setProperty("--theme-accent-b", String(b));
  }, [accentColor]);
}
