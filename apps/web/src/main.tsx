/* FILE: apps/web/src/main.tsx */
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "./global.css";
import { initPwa } from "./pwa";
import { initSync } from "./sync/sync";
import { repo } from "./storage/repo";
import { setLanguage, t } from "./i18n/strings";
import { initNativeSafeArea } from "./utils/native-safe-area";
import { maybeApplyDevSeedFromUrl } from "./storage/dev-seed";
import { getOrCreateIdentity } from "./sync/identity";
import { finishRecoveryRestore } from "./sync/recovery";
import { IS_NATIVE_APP } from "./utils/app-envs";

async function bootstrap() {
  const root = ReactDOM.createRoot(document.getElementById("root")!);
  // SW + callbacks
  initPwa();
  initNativeSafeArea();

  // Dev-only URL seed helper:
  // http://localhost:5173/?seed=demo
  // http://localhost:5173/?seed=graph
  try {
    await maybeApplyDevSeedFromUrl();
  } catch (err) {
    console.error("Dev seed import failed:", err);
  }

  // set language ASAP (before first render)
  try {
    const prefs = await repo.getPreferences();
    setLanguage(prefs.language);
  } catch {
    setLanguage("en");
  }

  const identity = await getOrCreateIdentity();
  if (identity.restorePhase) {
    root.render(<main aria-busy="true"><p>{t.prefs.recovery.finishingRestore}</p></main>);
    const retry = () => finishRecoveryRestore().then(() => window.location.reload()).catch(() => {});
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") retry();
    });
    if (IS_NATIVE_APP) {
      import("@capacitor/app")
        .then(({ App }) => App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) retry();
        }))
        .catch(() => {});
    }
    retry();
    return;
  }

  // sync auto (best effort)
  initSync().catch(() => {});

  root.render(
    <React.StrictMode>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </React.StrictMode>,
  );
}

bootstrap();
