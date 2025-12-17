// apps/web/src/ui/AppLayout.tsx
import { NavLink, Outlet } from "react-router-dom";
import { t } from "../i18n/strings";

function BottomNav() {
  return (
    <nav className="bottomNav">
      <NavLink to="/" end className="bottomNavLink">
        {t.nav.home}
      </NavLink>
      <NavLink to="/movements" className="bottomNavLink">
        {t.nav.movements}
      </NavLink>
      <NavLink to="/preferences" className="bottomNavLink">
        {t.nav.preferences}
      </NavLink>
    </nav>
  );
}

export function AppLayout() {
  return (
    <div className="appShell">
      <header className="topHeader">
        <h1 className="appTitle">{t.appName}</h1>

        <nav className="topNav">
          <NavLink to="/" end>
            {t.nav.home}
          </NavLink>
          <NavLink to="/movements">{t.nav.movements}</NavLink>
          <NavLink to="/preferences">{t.nav.preferences}</NavLink>
        </nav>
      </header>

      <main className="mainContent">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
