// apps/web/src/components/PwaUpdateBanner.tsx
import { useEffect, useState } from "react";
import type { PwaUpdateSnapshot } from "../pwa";
import { pwaDismiss, pwaRestartNow, pwaUpdateOnReopen, subscribePwa } from "../pwa";

export function PwaUpdateBanner() {
  const [s, setS] = useState<PwaUpdateSnapshot>({
    offlineReady: false,
    needRefresh: false,
    dismissed: false,
  });

  const [busy, setBusy] = useState<"now" | "later" | null>(null);

  useEffect(() => subscribePwa(setS), []);

  // Solo mostramos cuando hay update y el usuario no lo cerró.
  if (!s.needRefresh || s.dismissed) return null;

  return (
    <div className="pwaToast" role="status" aria-live="polite">
      <div className="pwaToast__content">
        <div className="pwaToast__title">Nueva versión disponible</div>
        <div className="pwaToast__subtitle">
          Puedes reiniciar ahora o actualizar cuando vuelvas a abrir.
        </div>
      </div>

      <div className="pwaToast__actions">
        <button
          type="button"
          className="pwaToast__btn pwaToast__btn--ghost"
          disabled={busy !== null}
          onClick={async () => {
            try {
              setBusy("later");
              await pwaUpdateOnReopen();
            } finally {
              setBusy(null);
            }
          }}
        >
          {busy === "later" ? "Preparando…" : "Al reabrir"}
        </button>

        <button
          type="button"
          className="pwaToast__btn pwaToast__btn--primary"
          disabled={busy !== null}
          onClick={async () => {
            try {
              setBusy("now");
              await pwaRestartNow();
            } finally {
              setBusy(null);
            }
          }}
        >
          {busy === "now" ? "Reiniciando…" : "Reiniciar"}
        </button>

        <button
          type="button"
          className="pwaToast__btn pwaToast__btn--icon"
          aria-label="Cerrar"
          title="Cerrar"
          disabled={busy !== null}
          onClick={() => pwaDismiss()}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
