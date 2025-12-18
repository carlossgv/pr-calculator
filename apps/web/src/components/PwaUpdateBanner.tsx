/* apps/web/src/components/PwaUpdateBanner.tsx */
import { useEffect, useState } from "react";
import type { PwaUpdateSnapshot } from "../pwa";
import { pwaDismiss, pwaRestartNow, subscribePwa } from "../pwa";

export function PwaUpdateBanner() {
  const [s, setS] = useState<PwaUpdateSnapshot>({
    offlineReady: false,
    needRefresh: false,
    dismissed: false,
  });

  const [busy, setBusy] = useState(false);

  useEffect(() => subscribePwa(setS), []);

  /**
   * Con registerType: "autoUpdate":
   * - La app intentará actualizar sola.
   * - Este banner queda como fallback cuando el navegador deja un SW esperando.
   * - La forma coherente de "aplicar" es: reiniciar (reload).
   */
  if (!s.needRefresh || s.dismissed) return null;

  return (
    <div className="pwaToast" role="status" aria-live="polite">
      <div className="pwaToast__content">
        <div className="pwaToast__title">Actualización lista</div>
        <div className="pwaToast__subtitle">
          Para aplicar los cambios, reinicia la app.
        </div>
      </div>

      <div className="pwaToast__actions">
        <button
          type="button"
          className="pwaToast__btn pwaToast__btn--primary"
          disabled={busy}
          onClick={async () => {
            try {
              setBusy(true);
              await pwaRestartNow();
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Reiniciando…" : "Reiniciar"}
        </button>

        <button
          type="button"
          className="pwaToast__btn pwaToast__btn--icon"
          aria-label="Cerrar"
          title="Cerrar"
          disabled={busy}
          onClick={() => pwaDismiss()}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
