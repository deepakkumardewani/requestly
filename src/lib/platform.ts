/** Returns true when running on macOS (client-side only). */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

/** Returns the platform modifier key label: ⌘ on macOS, Ctrl elsewhere. */
export function modKey(): string {
  return isMac() ? "⌘" : "Ctrl";
}
