/* apps/web/src/router.tsx */
import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { HomePage } from "./pages/HomePage";
import { PreferencesPage } from "./pages/PreferencesPage";
import { MovementsPage } from "./pages/MovementsPage";
import { MovementDetailsPage } from "./pages/MovementDetailsPage";
import { MovementCalcPage } from "./pages/MovementCalcPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "preferences", element: <PreferencesPage /> },

      { path: "movements", element: <MovementsPage /> },


      // ✅ new explicit manage route (preferred)
      {
        path: "movements/:movementId/manage",
        element: <MovementDetailsPage />,
      },

      // Calc
      {
        path: "movements/:movementId/calc/:unit/:weight",
        element: <MovementCalcPage />,
      },
    ],
  },
]);
