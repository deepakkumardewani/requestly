import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

/** ScrollArea uses `getAnimations` in jsdom/happy-dom, which is missing — stub as a simple container. */
vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "mock-scroll-area", className },
      children,
    ),
}));

import enCommon from "../messages/en/common.json";
import enErrors from "../messages/en/errors.json";
import enNavigation from "../messages/en/navigation.json";
import enRequest from "../messages/en/request.json";
import enResponse from "../messages/en/response.json";
import enSettings from "../messages/en/settings.json";

const messages: Record<string, Record<string, unknown>> = {
  settings: enSettings,
  common: enCommon,
  errors: enErrors,
  navigation: enNavigation,
  request: enRequest,
  response: enResponse,
};

vi.mock("next-intl", () => {
  return {
    useTranslations: (namespace: string) => {
      const nsMessages = messages[namespace] || {};
      return (key: string) => {
        // Resolve nested keys if any (like "sections.general")
        const parts = key.split(".");
        let current: unknown = nsMessages;
        for (const part of parts) {
          if (current == null || typeof current !== "object") return key;
          current = (current as Record<string, unknown>)[part];
        }
        return (current as string) ?? key;
      };
    },
  };
});
