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
import { maybeApplyDevSeedFromUrl } from "./storage/dev-seed";

async function bootstrap() {
  // SW + callbacks
  initPwa();
  initNativeSafeArea();

  // Dev-only URL seed helper:
  // http://localhost:5173/?seed=demo
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

  // sync auto (best effort)
  initSync().catch(() => {});

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </React.StrictMode>,
  );
}

bootstrap();
