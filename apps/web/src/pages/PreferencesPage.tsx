
// apps/web/src/pages/PreferencesPage.tsx
import React, { useEffect, useState } from "react";
import type { UserPreferences } from "@repo/core";
import { DEFAULT_PREFS } from "@repo/core";
import { repo } from "../storage/repo";

export function PreferencesPage() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    repo.getPreferences().then(setPrefs);
  }, []);

  async function onSave() {
    await repo.setPreferences(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Unidad</span>
        <select
          value={prefs.unit}
          onChange={(e) => setPrefs({ ...prefs, unit: e.target.value as "kg" | "lb" })}
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Peso barra</span>
        <input
          type="number"
          value={prefs.barWeight}
          onChange={(e) => setPrefs({ ...prefs, barWeight: Number(e.target.value) })}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Rounding (redondeo)</span>
        <input
          type="number"
          value={prefs.rounding}
          onChange={(e) => setPrefs({ ...prefs, rounding: Number(e.target.value) })}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Placas disponibles (por lado, separadas por coma)</span>
        <input
          value={prefs.plates.join(",")}
          onChange={(e) => {
            const plates = e.target.value
              .split(",")
              .map((x) => Number(x.trim()))
              .filter((n) => Number.isFinite(n) && n > 0);
            setPrefs({ ...prefs, plates });
          }}
        />
      </label>

      <button onClick={onSave}>Guardar</button>
      {saved && <p style={{ margin: 0 }}>✅ Guardado</p>}
    </div>
  );
}
