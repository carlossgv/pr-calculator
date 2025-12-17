// apps/web/src/pages/HomePage.tsx
import { useEffect, useMemo, useState } from "react";
import type { Unit, UserPreferences } from "@repo/core";
import { convertWeightValue } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { PercentCards } from "../components/PercentCards";
import { prefsForUnit } from "../utils/equipment";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function HomePage() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [unit, setUnit] = useState<Unit>("kg");
  const [maxWeight, setMaxWeight] = useState<number>(100);

  useEffect(() => {
    repo.getPreferences().then((p) => {
      setPrefs(p);
      setUnit(p.defaultUnit);
    });
  }, []);

  function switchUnit(next: Unit) {
    if (next === unit) return;
    const converted = convertWeightValue(maxWeight, unit, next);
    setUnit(next);
    setMaxWeight(round1(converted));
  }

  const effectivePrefs = useMemo(() => {
    if (!prefs) return null;
    return prefsForUnit(prefs, unit);
  }, [prefs, unit]);

  if (!prefs || !effectivePrefs) return <p>{t.home.loading}</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => switchUnit("kg")} aria-pressed={unit === "kg"} style={{ opacity: unit === "kg" ? 1 : 0.6 }}>
          KG
        </button>
        <button onClick={() => switchUnit("lb")} aria-pressed={unit === "lb"} style={{ opacity: unit === "lb" ? 1 : 0.6 }}>
          LB
        </button>
        <span style={{ opacity: 0.75 }}>(default: {prefs.defaultUnit.toUpperCase()})</span>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        <span>
          {t.home.maxWeight} ({unit})
        </span>
        <input
          type="number"
          value={maxWeight}
          onChange={(e) => setMaxWeight(Number(e.target.value))}
        />
      </label>

      <PercentCards
        maxWeight={maxWeight}
        unit={unit}
        prefs={effectivePrefs}
        fromPct={125}
        toPct={40}
        stepPct={5}
      />
    </div>
  );
}
