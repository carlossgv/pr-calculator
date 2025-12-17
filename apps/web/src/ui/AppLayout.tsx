// apps/web/src/ui/AppLayout.tsx
import { NavLink, Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>PR Calculator</h1>
        <nav style={{ display: "flex", gap: 10 }}>
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/movimientos">Movimientos</NavLink>
          <NavLink to="/preferencias">Preferencias</NavLink>
        </nav>
      </header>

      <main style={{ marginTop: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
