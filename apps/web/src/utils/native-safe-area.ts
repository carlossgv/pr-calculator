// apps/web/src/utils/native-safe-area.ts
import { IS_NATIVE_APP } from "./app-envs";

function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function isKeyboardLikelyOpen(): boolean {
  const vv = window.visualViewport;
  if (!vv) return false;

  // In Android WebView, when IME opens the visual viewport shrinks a lot.
  // We treat that as keyboard-open and avoid adding artificial bottom inset.
  const viewportDelta = window.innerHeight - vv.height;
  return viewportDelta > 120;
}

function computeBottomInset(): number {
  const vv = window.visualViewport;
  const viewportHeight = vv?.height ?? window.innerHeight;
  const screenHeight = window.screen?.height ?? viewportHeight;

  const diff = Math.max(0, screenHeight - viewportHeight);

  // Guardrails: native nav/gesture insets should be relatively small.
  return Math.min(diff, 40);
}

function applyInset() {
  if (isKeyboardLikelyOpen()) {
    document.documentElement.style.setProperty("--native-bottom-inset", "0px");
    return;
  }

  const inset = computeBottomInset();
  document.documentElement.style.setProperty(
    "--native-bottom-inset",
    `${inset}px`,
  );
}

export function initNativeSafeArea() {
  if (typeof document !== "undefined" && IS_NATIVE_APP) {
    document.documentElement.classList.add("is-native");
  }

  if (typeof window === "undefined") return;
  if (!IS_NATIVE_APP) return;
  if (!isAndroid()) return;

  applyInset();

  window.addEventListener("resize", applyInset, { passive: true });
  window.visualViewport?.addEventListener("resize", applyInset, {
    passive: true,
  });
  window.visualViewport?.addEventListener("scroll", applyInset, {
    passive: true,
  });
}
