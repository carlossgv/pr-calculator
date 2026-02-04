// apps/web/src/utils/native-safe-area.ts
import { IS_NATIVE_APP } from "./app-envs";

function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function computeBottomInset(): number {
  const vv = window.visualViewport;
  const viewportHeight = vv?.height ?? window.innerHeight;
  const screenHeight = window.screen?.height ?? viewportHeight;

  const diff = Math.max(0, screenHeight - viewportHeight);

  // Guardrails: avoid absurd values from device quirks.
  return Math.min(diff, 80);
}

function applyInset() {
  const inset = computeBottomInset();
  document.documentElement.style.setProperty(
    "--native-bottom-inset",
    `${inset}px`,
  );
}

export function initNativeSafeArea() {
  if (typeof window === "undefined") return;
  if (!IS_NATIVE_APP) return;
  if (!isAndroid()) return;

  applyInset();

  window.addEventListener("resize", applyInset, { passive: true });
  window.visualViewport?.addEventListener("resize", applyInset, {
    passive: true,
  });
}
