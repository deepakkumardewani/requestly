"use client";

import { JsonComparePage } from "@/components/json-compare/JsonComparePage";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const BREADCRUMB_ITEMS = [
  { label: "Home", href: "/" },
  { label: "JSON Compare" },
];

export default function JsonComparePage_() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex shrink-0 items-center border-b px-4 py-2">
        <AppBreadcrumb items={BREADCRUMB_ITEMS} />
      </div>

      {/* Main content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <JsonComparePage />
      </div>
    </div>
  );
}
