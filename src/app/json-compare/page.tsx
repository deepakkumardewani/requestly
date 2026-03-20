"use client";

import Link from "next/link";
import { JsonComparePage } from "@/components/json-compare/JsonComparePage";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function JsonComparePage_() {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Breadcrumb header */}
      <div className="flex shrink-0 items-center border-b px-4 py-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>JSON Compare</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <JsonComparePage />
      </div>
    </div>
  );
}
