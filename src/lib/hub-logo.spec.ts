import { describe, expect, it } from "vitest";
import { resolveHubLogoUrl } from "./hub-logo";

describe("resolveHubLogoUrl", () => {
  it("returns non-simpleicons URLs unchanged", () => {
    const u = "https://example.com/logo.png";
    expect(resolveHubLogoUrl(u, true)).toBe(u);
    expect(resolveHubLogoUrl(u, false)).toBe(u);
  });

  it("returns unchanged for simpleicons URL with empty path", () => {
    expect(resolveHubLogoUrl("https://cdn.simpleicons.org/", false)).toBe(
      "https://cdn.simpleicons.org/",
    );
  });

  it("adds hex segment for slug-only simpleicons path", () => {
    expect(resolveHubLogoUrl("https://cdn.simpleicons.org/stripe", false)).toBe(
      "https://cdn.simpleicons.org/stripe/000000",
    );
    expect(resolveHubLogoUrl("https://cdn.simpleicons.org/stripe", true)).toBe(
      "https://cdn.simpleicons.org/stripe/ffffff",
    );
    expect(
      resolveHubLogoUrl("https://cdn.simpleicons.org/stripe?q=1", true),
    ).toBe("https://cdn.simpleicons.org/stripe/ffffff?q=1");
  });

  it("replaces near-black hex with white in dark mode only", () => {
    expect(
      resolveHubLogoUrl("https://cdn.simpleicons.org/foo/000000", true),
    ).toBe("https://cdn.simpleicons.org/foo/ffffff");
    expect(
      resolveHubLogoUrl("https://cdn.simpleicons.org/foo/000000", false),
    ).toBe("https://cdn.simpleicons.org/foo/000000");
  });

  it("leaves explicit brand colors on simpleicons", () => {
    const colored = "https://cdn.simpleicons.org/discord/5865f2";
    expect(resolveHubLogoUrl(colored, true)).toBe(colored);
  });

  it("returns original string when URL is invalid", () => {
    const bad = "not-a-url";
    expect(resolveHubLogoUrl(bad, false)).toBe(bad);
  });

  it("handles IP hosts like any non-simpleicons origin", () => {
    const u = "https://127.0.0.1/icon.svg";
    expect(resolveHubLogoUrl(u, true)).toBe(u);
  });
});
