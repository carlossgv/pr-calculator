// apps/web/src/ui/AppLayout.tsx
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { UserPreferences } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { applyTheme, toResolvedTheme } from "../theme/theme";
import { Home, Dumbbell, Settings } from "lucide-react";
import { PwaUpdateBanner } from "../components/PwaUpdateBanner";

function topIconClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "navIconLink isActive" : "navIconLink";
}

function BottomNav() {
  return (
    <nav className="bottomNav" aria-label="Bottom navigation">
      <NavLink
        to="/"
        end
        className="bottomNavLink"
        aria-label={t.nav.home}
        title={t.nav.home}
      >
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

function DevBadge({ isDev }: { isDev: boolean }) {
  if (!isDev) return null;

  return (
    <span
      style={{
        marginLeft: 8,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.6,
        padding: "3px 8px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "rgba(124, 58, 237, 0.14)",
      }}
      aria-label="Development environment"
      title="Development environment"
    >
      DEV
    </span>
  );
}

export function AppLayout() {
  const [, setPrefs] = useState<UserPreferences | null>(null);

  const appEnv = import.meta.env.VITE_APP_ENV ?? "prod";
  const isDev = appEnv === "dev";
  const appTitle = t.appName;

  useEffect(() => {
    document.title = isDev ? `${appTitle} (DEV)` : appTitle;
  }, [appTitle, isDev]);

  useEffect(() => {
    repo.getPreferences().then((p) => {
      setPrefs(p);
      applyTheme(toResolvedTheme(p.theme));
    });
  }, []);

  return (
    <div className="appShell">
      <header className="topHeader">
        <div className="topLeft">
          <h1 className="appTitle">
            {appTitle}
            <DevBadge isDev={isDev} />
          </h1>
        </div>

        <div className="topRight">
          <nav className="topNav" aria-label="Top navigation">
            <NavLink
              to="/"
              end
              className={topIconClassName}
              aria-label={t.nav.home}
              title={t.nav.home}
            >
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
      <PwaUpdateBanner />
    </div>
  );
}
