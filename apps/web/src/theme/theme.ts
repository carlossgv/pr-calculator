// apps/web/src/theme/theme.ts
import type { ThemePreference } from "@repo/core";

export type ResolvedTheme = "light" | "dark";

export function detectSystemTheme(): ResolvedTheme {
  const isDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return isDark ? "dark" : "light";
}

export function toResolvedTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === "dark" || pref === "light") return pref;
  return detectSystemTheme();
}

export function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.dataset.theme = resolved;
}
