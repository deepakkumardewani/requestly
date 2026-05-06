"use client";

import { JsonVisualizePage } from "@/components/json-visualize/JsonVisualizePage";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const BREADCRUMB_ITEMS = [
  { label: "Home", href: "/" },
  { label: "JSON Visualize" },
];

export default function JsonVisualizePage_() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center border-b px-4 py-2">
        <AppBreadcrumb items={BREADCRUMB_ITEMS} />
        <h1 className="sr-only">JSON Visualize</h1>
      </header>

      <main id="app-main" className="min-h-0 flex-1 overflow-hidden">
        <JsonVisualizePage />
      </main>
    </div>
  );
}
