// apps/web/src/ui/AppLayout.tsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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
  const location = useLocation();

  // ✅ Source of truth: build-time env (matches manifest/index.html)
  const appEnv = import.meta.env.VITE_APP_ENV ?? "prod";
  const isDev = appEnv === "dev";
  const appTitle = import.meta.env.VITE_APP_TITLE || t.appName;

  const routeTitle = useMemo(() => {
    const p = location.pathname;

    if (p === "/") return t.nav.home;
    if (p.startsWith("/movements")) return t.nav.movements;
    if (p.startsWith("/preferences")) return t.nav.preferences;
    return appTitle;
  }, [location.pathname, appTitle]);

  useEffect(() => {
    // ✅ Tab title / app switcher title
    const suffix = isDev ? " (DEV)" : "";
    // If routeTitle == appTitle, don't duplicate
    const final =
      routeTitle === appTitle
        ? `${appTitle}${suffix}`
        : `${routeTitle} · ${appTitle}${suffix}`;

    document.title = final;
  }, [routeTitle, appTitle, isDev]);

  useEffect(() => {
    repo.getPreferences().then(async (p) => {
      // Back-compat: si alguien todavía tiene "system", lo resolvemos y persistimos.
      if ((p as any).theme === "system") {
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

      {/* 👇 Overlay global para update pro */}
      <PwaUpdateBanner />
    </div>
  );
}
