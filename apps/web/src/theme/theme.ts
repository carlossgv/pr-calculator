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

function setMetaThemeColor(color: string) {
  let meta = document.querySelector(
    'meta[name="theme-color"]',
  ) as HTMLMetaElement | null;

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }

  meta.content = color;
}

function syncThemeColorWithCssBg() {
  // toma el token real ya aplicado por CSS (light/dark)
  const bg = getComputedStyle(document.documentElement)
    .getPropertyValue("--bg")
    .trim();

  if (bg) setMetaThemeColor(bg);
}

export function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.dataset.theme = resolved;

  // ✅ Android: pinta status bar/task switcher usando el mismo fondo de la app
  syncThemeColorWithCssBg();
}
