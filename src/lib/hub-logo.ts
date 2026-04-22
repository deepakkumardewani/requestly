const SIMPLEICONS_HOST = "cdn.simpleicons.org";

const DARK_REPLACABLE_HEX = new Set([
  "0",
  "00",
  "000",
  "0000",
  "00000",
  "000000",
  "181717", // simple-icons default for some brands (near-black)
]);

/**
 * Simple Icons are often default-dark. For dark UIs, use a light hex so
 * logos stay visible. URLs without a color segment get a theme-appropriate
 * color; explicit near-black brand colors are swapped in dark mode only.
 * Colored slugs (e.g. Discord blurple) are left as-is.
 */
export function resolveHubLogoUrl(logoUrl: string, isDark: boolean): string {
  try {
    const url = new URL(logoUrl);
    if (url.hostname !== SIMPLEICONS_HOST) {
      return logoUrl;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return logoUrl;
    }

    if (segments.length === 1) {
      const hex = isDark ? "ffffff" : "000000";
      return `${url.origin}/${segments[0]}/${hex}${url.search}`;
    }

    if (segments.length === 2) {
      const [slug, color] = segments;
      const norm = color.toLowerCase();
      if (isDark && DARK_REPLACABLE_HEX.has(norm)) {
        return `${url.origin}/${slug}/ffffff${url.search}`;
      }
    }

    return logoUrl;
  } catch {
    return logoUrl;
  }
}
