"use client";

import { useEffect } from "react";
import { METHOD_PALETTE } from "@/lib/constants";
import type { HttpMethod } from "@/types";

/**
 * Updates CSS variables on <html> to drive the method-specific accent color.
 * All Tailwind utilities using `text-method-accent`, `bg-method-accent/*`, etc.
 * will automatically reflect the active method's color.
 */
export function useMethodTheme(method: HttpMethod) {
  useEffect(() => {
    const { r, g, b } = METHOD_PALETTE[method];
    const root = document.documentElement;
    root.style.setProperty("--method-accent-r", String(r));
    root.style.setProperty("--method-accent-g", String(g));
    root.style.setProperty("--method-accent-b", String(b));
  }, [method]);
}
