// apps/web/src/i18n/strings.ts
import { useSyncExternalStore } from "react";
import type { Language } from "@repo/core";
import { en } from "./strings.en";
import { es } from "./strings.es";

const dict = { en, es } as const;

let currentLanguage: Language = "en";

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(next: Language) {
  if (next === currentLanguage) return;
  currentLanguage = next;
  emit();
}

export function subscribeLanguage(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useLanguage(): Language {
  return useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
}

function active() {
  return dict[currentLanguage] ?? dict.en;
}

export const t = new Proxy({} as typeof en, {
  get(_target, prop) {
    return (active() as any)[prop as any];
  },
}) as typeof en;
