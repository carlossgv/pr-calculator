// apps/web/src/pwa.ts
import { registerSW } from "virtual:pwa-register";
import { IS_NATIVE_APP } from "./utils/app-envs";

export type PwaUpdateSnapshot = {
  offlineReady: boolean;

  /**
   * En autoUpdate normalmente NO lo necesitas, pero lo dejamos como fallback
   * si el navegador deja un SW en waiting (puede pasar).
   */
  needRefresh: boolean;

  /**
   * En autoUpdate el banner debería ser opcional. Lo dejamos por compatibilidad
   * con tu UI actual.
   */
  dismissed: boolean;
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
let registrationRef: ServiceWorkerRegistration | null = null;

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

function setupForegroundUpdateCheck() {
  if (typeof document === "undefined") return;

  // Cuando el usuario vuelve a la app, fuerza un check del SW.
  const onVis = () => {
    if (document.visibilityState !== "visible") return;
    registrationRef?.update().catch(() => {});
  };

  document.addEventListener("visibilitychange", onVis, { passive: true });
}

export function initPwa() {
  if (IS_NATIVE_APP) return;
  if (initialized) return;
  initialized = true;

  updateServiceWorkerFn = registerSW({
    immediate: true,

    onOfflineReady() {
      emit({ offlineReady: true });
    },

    // En autoUpdate esto puede disparar rara vez; lo dejamos por si acaso.
    onNeedRefresh() {
      emit({ needRefresh: true, dismissed: false });
    },

    onRegisteredSW(_swUrl, registration) {
      registrationRef = registration ?? null;

      // Check inmediato al registrar.
      registrationRef?.update().catch(() => {});

      // Check cada cierto tiempo mientras la app está abierta (opcional).
      setInterval(() => {
        registrationRef?.update().catch(() => {});
      }, 30 * 60 * 1000); // 30 min

      setupForegroundUpdateCheck();
    },

    onRegisterError(_error) {
      // no-op
    },
  });
}

/**
 * Reiniciar ahora:
 * - Fuerza el SW nuevo (si hay) y recarga.
 * - Útil como botón “por si acaso”.
 */
export async function pwaRestartNow() {
  if (!updateServiceWorkerFn) return;
  await updateServiceWorkerFn(true);
}

/**
 * En autoUpdate, “update on reopen” es menos relevante porque el SW se activa solo,
 * pero lo dejamos por compatibilidad: intenta activar sin recargar.
 */
export async function pwaUpdateOnReopen() {
  if (!updateServiceWorkerFn) return;
  await updateServiceWorkerFn(false);
  emit({ dismissed: true });
}

export function pwaDismiss() {
  emit({ dismissed: true });
}

/** Por si tu UI quiere limpiar el estado tras mostrar un toast/modal */
export function pwaResetFlags() {
  emit({ offlineReady: false, needRefresh: false });
}
