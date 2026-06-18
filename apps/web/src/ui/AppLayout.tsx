// FILE: apps/web/src/ui/AppLayout.tsx
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { UserPreferences } from "@repo/core";
import { repo } from "../storage/repo";
import { t, useLanguage } from "../i18n/strings";
import { applyTheme, toResolvedTheme } from "../theme/theme";
import { Home, Dumbbell, Settings, TrendingUp } from "lucide-react";
import { PwaUpdateBanner } from "../components/PwaUpdateBanner";
import { Modal } from "./Modal";
import { Button } from "./Button";

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

function isRestorablePath(path: string) {
  // regla simple: no guardes cosas raras o gigantes
  if (!path.startsWith("/")) return false;

  // no tiene sentido "restaurar" el home (lo usamos como trigger de restore)
  if (path === "/") return false;

  // evita loops tipo "/preferences" si no quieres que vuelva ahí.
  // (si sí quieres, borra esta línea)
  // if (path.startsWith("/preferences")) return false;

  return true;
}

function getNavigationType(): string | null {
  if (typeof performance === "undefined") return null;
  const entries = performance.getEntriesByType?.("navigation") ?? [];
  const entry = entries[0] as PerformanceNavigationTiming | undefined;
  if (entry?.type) return entry.type;

  const legacy = (performance as any).navigation?.type;
  if (legacy === 1) return "reload";
  if (legacy === 2) return "back_forward";
  if (legacy === 0) return "navigate";
  return null;
}

function getMovementIdFromPath(path: string): string | null {
  const match = path.match(/^\/movements\/([^/]+)\/(?:manage|trends|calc\/[^/]+\/[^/]+)(?:[?#].*)?$/);
  return match?.[1] ?? null;
}

export function AppLayout() {
  useLanguage(); // ✅ fuerza re-render cuando cambia el idioma
  const [, setPrefs] = useState<UserPreferences | null>(null);
  const [showTrendsOnboarding, setShowTrendsOnboarding] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const didRestoreRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  const appEnv = import.meta.env.VITE_APP_ENV ?? "prod";
  const isDev = appEnv === "dev";
  const appTitle = t.appName;

  useEffect(() => {
    document.title = isDev ? `${appTitle} (DEV)` : appTitle;
  }, [appTitle, isDev]);

  useEffect(() => {
    repo.getPreferences().then((p) => {
      setPrefs(p);
      applyTheme(toResolvedTheme(p.theme), p.accentColor);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    repo
      .getFeatureTrendsOnboardingSeen()
      .then((seen) => {
        if (cancelled) return;
        if (!seen) setShowTrendsOnboarding(true);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  async function dismissTrendsOnboarding() {
    setShowTrendsOnboarding(false);
    await repo.markFeatureTrendsOnboardingSeen();
  }

  async function goToLatestTrends() {
    await dismissTrendsOnboarding();

    const lastRoute = await repo.getLastRoute();
    const movementId = lastRoute ? getMovementIdFromPath(lastRoute) : null;
    if (movementId) {
      navigate(`/movements/${movementId}/trends`);
      return;
    }

    navigate("/movements");
  }

  // 1) Restore-on-open:
  //    Solo corre cuando caes en "/" (PWA start_url) y todavía no restauramos.
  useEffect(() => {
    if (didRestoreRef.current) return;
    if (location.pathname !== "/") return;

    const navType = getNavigationType();
    if (navType === "reload") {
      didRestoreRef.current = true;
      return;
    }

    didRestoreRef.current = true;

    repo.getLastRoute().then((path) => {
      if (!path) return;
      if (!isRestorablePath(path)) return;

      // evita bucle por si alguien guardó "/" por error
      if (path === "/") return;

      navigate(path, { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // 2) Persist current route (debounced)
  useEffect(() => {
    const path =
      location.pathname + (location.search ?? "") + (location.hash ?? "");

    if (!isRestorablePath(path)) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      repo.setLastRoute(path).catch(() => {});
    }, 250);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    };
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className="appShell">
      <header className="topHeader">
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

      {showTrendsOnboarding ? (
        <Modal
          title={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={18} />
              {t.onboarding.trends.title}
            </span>
          }
          ariaLabel={t.onboarding.trends.title}
          onClose={dismissTrendsOnboarding}
          closeLabel={t.common.close}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
              {t.onboarding.trends.body}
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button
                variant="primary"
                shape="pill"
                onClick={goToLatestTrends}
              >
                {t.onboarding.trends.cta}
              </Button>

              <Button variant="ghost" shape="pill" onClick={dismissTrendsOnboarding}>
                {t.onboarding.trends.dismiss}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      <BottomNav />
      <PwaUpdateBanner />
    </div>
  );
}
