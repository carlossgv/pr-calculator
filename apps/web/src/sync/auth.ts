// FILE: apps/web/src/sync/auth.ts
import type { ApiAuth } from "./api";

const KEY_ID = "prcalc_deviceId";
const KEY_TOKEN = "prcalc_deviceToken";

function uid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `d_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function randToken(): string {
  // No es “seguridad fuerte”; es identidad estable para backup.
  // (Si quieres, lo hacemos 32 bytes crypto.getRandomValues)
  return `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
}

export function getAuthOrNull(): ApiAuth | null {
  if (typeof window === "undefined") return null;
  const deviceId = window.localStorage.getItem(KEY_ID) ?? "";
  const deviceToken = window.localStorage.getItem(KEY_TOKEN) ?? "";
  if (!deviceId || !deviceToken) return null;
  return { deviceId, deviceToken };
}

export function getOrCreateAuth(): ApiAuth {
  if (typeof window === "undefined") {
    // SSR no aplica en Vite SPA, pero por si acaso:
    return { deviceId: "server", deviceToken: "server" };
  }

  const existing = getAuthOrNull();
  if (existing) return existing;

  const next: ApiAuth = { deviceId: uid(), deviceToken: randToken() };
  window.localStorage.setItem(KEY_ID, next.deviceId);
  window.localStorage.setItem(KEY_TOKEN, next.deviceToken);
  return next;
}
