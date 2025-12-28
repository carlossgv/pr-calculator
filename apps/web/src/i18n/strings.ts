// apps/web/src/i18n/strings.ts
import type { Language } from "@repo/core";
import { en } from "./strings.en";
import { es } from "./strings.es";

const dict = { en, es } as const;

let currentLanguage: Language = "en";

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(next: Language) {
  currentLanguage = next;
}

function active() {
  return dict[currentLanguage] ?? dict.en;
}

export const t = new Proxy({} as typeof en, {
  get(_target, prop) {
    return (active() as any)[prop as any];
  },
}) as typeof en;
