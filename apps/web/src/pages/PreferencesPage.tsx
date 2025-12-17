// apps/web/src/pages/PreferencesPage.tsx
import { useEffect, useState } from "react";
import type { Unit, UserPreferences } from "@repo/core";
import {
  DEFAULT_PREFS,
  CROSSFIT_LB_WITH_KG_CHANGES,
} from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";

export function PreferencesPage() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [saved, setSaved] = useState(false);
  const [presetApplied, setPresetApplied] = useState(false);

  useEffect(() => {
    repo.getPreferences().then(setPrefs);
  }, []);

  if (!prefs) return <p>{t.home.loading}</p>;

  function save(next: UserPreferences) {
    setPrefs(next);
    repo.setPreferences(next).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    });
  }

  function applyPreset(preset: UserPreferences) {
    save(preset);
    setPresetApplied(true);
    setTimeout(() => setPresetApplied(false), 1200);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* DEFAULT UNIT */}
      <section style={{ display: "grid", gap: 8 }}>
        <label>
          {t.prefs.unit}
          <select
            value={prefs.defaultUnit}
            onChange={(e) =>
              save({ ...prefs, defaultUnit: e.target.value as Unit })
            }
            style={{ display: "block", width: "100%" }}
          >
            <option value="kg">KG</option>
            <option value="lb">LB</option>
          </select>
        </label>
      </section>

      {/* BAR */}
      <section style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Bar</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            value={prefs.bar.value}
            onChange={(e) =>
              save({
                ...prefs,
                bar: { ...prefs.bar, value: Number(e.target.value) },
              })
            }
          />
          <select
            value={prefs.bar.unit}
            onChange={(e) =>
              save({
                ...prefs,
                bar: { ...prefs.bar, unit: e.target.value as Unit },
              })
            }
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
      </section>

      {/* ROUNDING */}
      <section style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>{t.prefs.rounding}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            value={prefs.rounding.value}
            onChange={(e) =>
              save({
                ...prefs,
                rounding: {
                  ...prefs.rounding,
                  value: Number(e.target.value),
                },
              })
            }
          />
          <select
            value={prefs.rounding.unit}
            onChange={(e) =>
              save({
                ...prefs,
                rounding: {
                  ...prefs.rounding,
                  unit: e.target.value as Unit,
                },
              })
            }
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
      </section>

      {/* PRESETS */}
      <section style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 600 }}>{t.prefs.presets.title}</div>

        <button onClick={() => applyPreset(DEFAULT_PREFS)}>
          {t.prefs.presets.olympicKg}
        </button>

        <button onClick={() => applyPreset(CROSSFIT_LB_WITH_KG_CHANGES)}>
          {t.prefs.presets.crossfitLb}
        </button>

        {presetApplied && <div>✅ {t.prefs.presets.applied}</div>}
      </section>

      {saved && <div>{t.prefs.saved}</div>}
    </div>
  );
}
