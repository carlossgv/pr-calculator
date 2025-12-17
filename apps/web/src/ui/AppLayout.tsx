// apps/web/src/ui/AppLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { t } from "../i18n/strings";

export function AppLayout() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>{t.appName}</h1>
        <nav style={{ display: "flex", gap: 10 }}>
          <NavLink to="/" end>{t.nav.home}</NavLink>
          <NavLink to="/movements">{t.nav.movements}</NavLink>
          <NavLink to="/preferences">{t.nav.preferences}</NavLink>
        </nav>
      </header>

      <main style={{ marginTop: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
