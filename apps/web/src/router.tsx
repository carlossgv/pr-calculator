// apps/web/src/router.tsx
import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { HomePage } from "./pages/HomePage";
import { PreferencesPage } from "./pages/PreferencesPage";
import { MovementsPage } from "./pages/MovementsPage";
import { MovementDetailsPage } from "./pages/MovementDetailsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "preferences", element: <PreferencesPage /> },
      { path: "movements", element: <MovementsPage /> },
      { path: "movements/:movementId", element: <MovementDetailsPage /> },
    ],
  },
]);
