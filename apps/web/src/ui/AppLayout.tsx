// apps/web/src/ui/AppLayout.tsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { UserPreferences } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { applyTheme, detectSystemTheme, type ResolvedTheme } from "../theme/theme";
import { ThemeToggle } from "../components/ThemeToggle";
import { Home, Dumbbell, Settings } from "lucide-react";

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
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    repo.getPreferences().then(async (p) => {
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

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (!prefs) return "light";
    return prefs.theme === "dark" ? "dark" : "light";
  }, [prefs]);

  async function toggleTheme() {
    if (!prefs) return;
    const nextTheme: ResolvedTheme = resolvedTheme === "dark" ? "light" : "dark";
    const next: UserPreferences = { ...prefs, theme: nextTheme };
    setPrefs(next);
    await repo.setPreferences(next);
    applyTheme(nextTheme);
  }

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

          <ThemeToggle value={resolvedTheme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className="mainContent">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
