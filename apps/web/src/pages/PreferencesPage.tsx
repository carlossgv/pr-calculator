// apps/web/src/pages/PreferencesPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { Unit, UserPreferences } from "@repo/core";
import { DEFAULT_PREFS, CROSSFIT_LB_WITH_KG_CHANGES } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { Switch } from "../components/Switch";
import { Mars, Venus } from "lucide-react";

type BarGender = "male" | "female";

function inferGenderFromPrefs(p: UserPreferences): BarGender {
  const unit = p.defaultUnit;
  const v = p.bar?.value ?? 0;

  if (unit === "lb") return v === 35 ? "female" : "male";
  return v === 15 ? "female" : "male";
}

function barValueFor(unit: Unit, gender: BarGender): number {
  if (unit === "lb") return gender === "male" ? 45 : 35;
  return gender === "male" ? 20 : 15;
}

export function PreferencesPage() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [barGender, setBarGender] = useState<BarGender>("male");

  useEffect(() => {
    repo.getPreferences().then((p) => {
      setPrefs(p);
      setBarGender(inferGenderFromPrefs(p));
    });
  }, []);

  const barUnit = useMemo<Unit>(() => {
    return prefs?.defaultUnit ?? "kg";
  }, [prefs?.defaultUnit]);

  if (!prefs) return <p>{t.home.loading}</p>;

  function save(next: UserPreferences) {
    setPrefs(next);
    repo.setPreferences(next);
  }

  function applyPreset(preset: UserPreferences) {
    // ✅ keep current gender, apply preset, and ensure we return a full UserPreferences
    const unit: Unit = preset.defaultUnit;

    const next: UserPreferences = {
      ...preset,
      defaultUnit: unit, // (explicitly non-optional for TS)
      bar: {
        ...preset.bar,
        unit,
        value: barValueFor(unit, barGender),
      },
    };

    save(next);
  }

  function setGender(nextGender: BarGender) {
    // Guard to satisfy TS + future-proof (even though UI won't call this while prefs=null)
    if (!prefs) return;

    setBarGender(nextGender);

    const next: UserPreferences = {
      ...prefs,
      bar: {
        ...prefs.bar,
        unit: barUnit,
        value: barValueFor(barUnit, nextGender),
      },
    };

    save(next);
  }

  const isFemale = barGender === "female";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* BAR */}
      <section style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 600 }}>Bar ({barUnit.toUpperCase()})</div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              aria-hidden="true"
              title="Male"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: !isFemale
                  ? "var(--nav-active-bg)"
                  : "var(--card-bg)",
                flex: "0 0 auto",
              }}
            >
              <Mars size={18} />
            </span>

            <Switch
              checked={isFemale}
              onCheckedChange={(next) => setGender(next ? "female" : "male")}
              ariaLabel="Toggle bar gender"
            />

            <span
              aria-hidden="true"
              title="Female"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: isFemale
                  ? "var(--nav-active-bg)"
                  : "var(--card-bg)",
                flex: "0 0 auto",
              }}
            >
              <Venus size={18} />
            </span>
          </div>

          <div
            style={{
              opacity: 0.85,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              flex: "0 0 auto",
            }}
            aria-label="Current bar weight"
          >
            {barValueFor(barUnit, barGender)}
            {barUnit}
          </div>
        </div>
      </section>

      {/* PRESETS */}
      <section style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 600 }}>{t.prefs.presets.title}</div>

        <button type="button" onClick={() => applyPreset(DEFAULT_PREFS)}>
          {t.prefs.presets.olympicKg}
        </button>

        <button
          type="button"
          onClick={() => applyPreset(CROSSFIT_LB_WITH_KG_CHANGES)}
        >
          {t.prefs.presets.crossfitLb}
        </button>
      </section>
    </div>
  );
}
