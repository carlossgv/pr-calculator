
/* FILE: apps/web/src/main.tsx */
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "./global.css";
import { initPwa } from "./pwa";
import { initSync } from "./sync/sync";

// 👇 registra SW + callbacks (needRefresh/offlineReady)
initPwa();

// 👇 sync auto (cloud backup) — best effort (offline ok)
initSync().catch(() => {});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </React.StrictMode>,
);
;
