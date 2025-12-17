// apps/web/src/ui/AppLayout.tsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { UserPreferences } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { applyTheme, detectSystemTheme, type ResolvedTheme } from "../theme/theme";
import { ThemeToggle } from "../components/ThemeToggle";

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
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    repo.getPreferences().then(async (p) => {
      // Bootstrap: si está en system, lo “materializamos” a light/dark y lo guardamos
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
          <nav className="topNav">
            <NavLink to="/" end>
              {t.nav.home}
            </NavLink>
            <NavLink to="/movements">{t.nav.movements}</NavLink>
            <NavLink to="/preferences">{t.nav.preferences}</NavLink>
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
