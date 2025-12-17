// apps/web/src/ui/AppLayout.tsx
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { UserPreferences } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { applyTheme, detectSystemTheme } from "../theme/theme";
import { Home, Dumbbell, Settings } from "lucide-react";
import { PwaUpdateBanner } from "../components/PwaUpdateBanner";

function topIconClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "navIconLink isActive" : "navIconLink";
}

function BottomNav() {
  return (
    <nav className="bottomNav" aria-label="Bottom navigation">
      <NavLink to="/" end className="bottomNavLink" aria-label={t.nav.home} title={t.nav.home}>
        <Home size={20} />
        <span className="bottomNavLabel">{t.nav.home}</span>
      </NavLink>

      <NavLink
        to="/movements"
        className="bottomNavLink"
        aria-label={t.nav.movements}
        title={t.nav.movements}
      >
        <Dumbbell size={20} />
        <span className="bottomNavLabel">{t.nav.movements}</span>
      </NavLink>

      <NavLink
        to="/preferences"
        className="bottomNavLink"
        aria-label={t.nav.preferences}
        title={t.nav.preferences}
      >
        <Settings size={20} />
        <span className="bottomNavLabel">{t.nav.preferences}</span>
      </NavLink>
    </nav>
  );
}

export function AppLayout() {
  const [, setPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    repo.getPreferences().then(async (p) => {
      // Back-compat: si alguien todavía tiene "system", lo resolvemos y persistimos.
      if (p.theme === "system") {
        const resolved = detectSystemTheme();
        const next: UserPreferences = { ...p, theme: resolved };
        await repo.setPreferences(next);
        setPrefs(next);
        applyTheme(resolved);
        return;
      }

      setPrefs(p);
      applyTheme(p.theme);
    });
  }, []);

  return (
    <div className="appShell">
      <header className="topHeader">
        <div className="topLeft">
          <h1 className="appTitle">{t.appName}</h1>
        </div>

        <div className="topRight">
          <nav className="topNav" aria-label="Top navigation">
            <NavLink to="/" end className={topIconClassName} aria-label={t.nav.home} title={t.nav.home}>
              <Home size={18} />
            </NavLink>

            <NavLink
              to="/movements"
              className={topIconClassName}
              aria-label={t.nav.movements}
              title={t.nav.movements}
            >
              <Dumbbell size={18} />
            </NavLink>

            <NavLink
              to="/preferences"
              className={topIconClassName}
              aria-label={t.nav.preferences}
              title={t.nav.preferences}
            >
              <Settings size={18} />
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mainContent">
        <Outlet />
      </main>

      <BottomNav />

      {/* 👇 Overlay global para update pro */}
      <PwaUpdateBanner />
    </div>
  );
}
