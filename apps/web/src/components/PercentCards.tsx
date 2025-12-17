// apps/web/src/components/PercentCards.tsx
import { useMemo } from "react";
import { calculateLoad, type Unit, type UserPreferences } from "@repo/core";
import { t } from "../i18n/strings";

type Props = {
  maxWeight: number;
  unit: Unit;
  prefs: UserPreferences;
  fromPct?: number;
  toPct?: number;
  stepPct?: number;
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function formatPickLabel(originalLabel: string | undefined, originalUnit: Unit, valueInUnit: number, unit: Unit) {
  // Si la placa es de otra unidad (ej: 2.5 kg), mostramos ambos
  if (originalUnit !== unit) {
    const base = (originalLabel?.trim() ? originalLabel : `${round1(valueInUnit)} ${unit}`);
    return `${base} (${round1(valueInUnit)} ${unit})`;
  }

  return originalLabel?.trim() ? originalLabel : `${round1(valueInUnit)} ${unit}`;
}

export function PercentCards({
  maxWeight,
  unit,
  prefs,
  fromPct = 125,
  toPct = 40,
  stepPct = 5,
}: Props) {
  const percents = useMemo(() => {
    const out: number[] = [];
    if (stepPct <= 0) return out;
    for (let p = fromPct; p >= toPct; p -= stepPct) out.push(p);
    return out;
  }, [fromPct, toPct, stepPct]);

  const cards = useMemo(() => {
    return percents.map((pct) => {
      const target = (maxWeight * pct) / 100;
      const load = calculateLoad(target, unit, prefs);
      return { pct, target, load };
    });
  }, [percents, maxWeight, unit, prefs]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {cards.map(({ pct, target, load }) => (
        <div
          key={pct}
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 12,
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{pct}%</div>
            <div style={{ fontSize: 18 }}>
              {round1(target)}{unit}
            </div>
          </div>

          <div style={{ opacity: 0.85 }}>
            <b>{t.home.bar}:</b>{" "}
            {formatPickLabel(load.bar.plate.label, load.bar.plate.unit, load.bar.valueInUnit, unit)} ·{" "}
            <b>{t.home.platesPerSide}:</b>{" "}
            {load.platesPerSide.length === 0
              ? "—"
              : load.platesPerSide
                  .map((p) => formatPickLabel(p.plate.label, p.plate.unit, p.valueInUnit, unit))
                  .join(" + ")}
          </div>

          <div style={{ opacity: 0.85 }}>
            <b>{t.home.perSideTotal}:</b> {round1(load.perSide)}{unit}
          </div>

          <div style={{ opacity: 0.85 }}>
            <b>{t.home.achieved}:</b> {round1(load.achievedTotal)}{unit} (Δ {round1(load.delta)})
          </div>
        </div>
      ))}
    </div>
  );
}
