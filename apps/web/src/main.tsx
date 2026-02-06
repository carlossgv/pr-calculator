/* FILE: apps/web/src/main.tsx */
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "./global.css";
import { initPwa } from "./pwa";
import { initSync } from "./sync/sync";
import { repo } from "./storage/repo";
import { setLanguage } from "./i18n/strings";
import { initNativeSafeArea } from "./utils/native-safe-area";
import { IS_NATIVE_APP } from "./utils/app-envs";

async function initLiveUpdate() {
  if (!IS_NATIVE_APP) return;
  try {
    const mod = await import("@capawesome/capacitor-live-update");
    await mod.LiveUpdate.ready();
  } catch {
    // ignore
  }
}

async function bootstrap() {
  // SW + callbacks
  initPwa();
  initNativeSafeArea();
  initLiveUpdate().catch(() => {});

  // set language ASAP (before first render)
  try {
    const prefs = await repo.getPreferences();
    setLanguage(prefs.language);
  } catch {
    setLanguage("en");
  }

  // sync auto (best effort)
  initSync().catch(() => {});

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </React.StrictMode>,
  );
}

bootstrap();
