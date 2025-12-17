// apps/web/src/pwa.ts
import { registerSW } from "virtual:pwa-register";

export type PwaUpdateSnapshot = {
  offlineReady: boolean;
  needRefresh: boolean;
  dismissed: boolean; // user hid the banner for this session
};

type Listener = (s: PwaUpdateSnapshot) => void;

let snapshot: PwaUpdateSnapshot = {
  offlineReady: false,
  needRefresh: false,
  dismissed: false,
};

let listeners: Listener[] = [];
let updateServiceWorkerFn: ((reloadPage?: boolean) => Promise<void>) | null =
  null;
let initialized = false;

function emit(next: Partial<PwaUpdateSnapshot>) {
  snapshot = { ...snapshot, ...next };
  for (const l of listeners) l(snapshot);
}

export function subscribePwa(listener: Listener) {
  listeners.push(listener);
  listener(snapshot);
  return () => {
    listeners = listeners.filter((x) => x !== listener);
  };
}

export function initPwa() {
  if (initialized) return;
  initialized = true;

  updateServiceWorkerFn = registerSW({
    immediate: true,
    onOfflineReady() {
      emit({ offlineReady: true });
    },
    onNeedRefresh() {
      // reset dismiss when a real update arrives
      emit({ needRefresh: true, dismissed: false });
    },
    onRegisteredSW(
      _swUrl: string,
      _registration: ServiceWorkerRegistration | undefined,
    ) {
      // no-op
    },
    onRegisterError(_error: unknown) {
      // no-op
    },
  });
}

/**
 * Reiniciar ahora:
 * - Activa el SW nuevo (skipWaiting) y recarga la app.
 */
export async function pwaRestartNow() {
  if (!updateServiceWorkerFn) return;
  await updateServiceWorkerFn(true);
}

/**
 * Actualizar al reabrir:
 * - Activa el SW nuevo pero NO recarga.
 * - La nueva versión se verá al cerrar y abrir la app.
 */
export async function pwaUpdateOnReopen() {
  if (!updateServiceWorkerFn) return;
  await updateServiceWorkerFn(false);
  // Ocultamos banner por esta sesión para que no moleste.
  emit({ dismissed: true });
}

export function pwaDismiss() {
  emit({ dismissed: true });
}
