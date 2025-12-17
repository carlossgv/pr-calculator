
// apps/web/src/router.tsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { HomePage } from "./pages/HomePage";
import { PreferencesPage } from "./pages/PreferencesPage";
import { MovementsPage } from "./pages/MovementsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "preferencias", element: <PreferencesPage /> },
      { path: "movimientos", element: <MovementsPage /> }
    ]
  }
]);
