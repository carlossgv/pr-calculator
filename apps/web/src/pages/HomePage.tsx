// apps/web/src/pages/HomePage.tsx
import { useEffect, useMemo, useState } from "react";
import { calculateLoad } from "@repo/core";
import { repo } from "../storage/repo";

export function HomePage() {
  const [target, setTarget] = useState(100);
  const [prefs, setPrefs] = useState<Awaited<
    ReturnType<typeof repo.getPreferences>
  > | null>(null);

  useEffect(() => {
    repo.getPreferences().then(setPrefs);
  }, []);

  const result = useMemo(() => {
    if (!prefs) return null;
    return calculateLoad(target, prefs);
  }, [target, prefs]);

  if (!prefs) return <p>Cargando…</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Peso total objetivo ({prefs.unit})</span>
        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
        />
      </label>

      {result && (
        <div
          style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}
        >
          <div>
            <b>Barra:</b> {result.barWeight}
            {prefs.unit}
          </div>
          <div>
            <b>Por lado:</b> {result.perSide}
            {prefs.unit}
          </div>
          <div>
            <b>Placas por lado:</b> {result.platesPerSide.join(" + ") || "—"}
          </div>
          <div style={{ marginTop: 8 }}>
            <b>Total logrado:</b> {result.achievedTotal}
            {prefs.unit} (Δ {result.delta})
          </div>
        </div>
      )}
    </div>
  );
}
