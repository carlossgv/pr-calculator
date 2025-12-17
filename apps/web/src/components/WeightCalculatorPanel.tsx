// apps/web/src/components/WeightCalculatorPanel.tsx
import { useEffect, useMemo, useState } from "react";
import type { Unit, UserPreferences } from "@repo/core";
import { convertWeightValue } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { PercentCards } from "../components/PercentCards";
import { prefsForUnit } from "../utils/equipment";
import { ContextBadge } from "../components/ContextBadge";
import { nearestLoadableTotalUnlimited } from "../utils/nearest-loadable";
import { UnitSwitch } from "./UnitSwitch";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

type ChangePayload = { unit: Unit; weight: number };

type Props = {
  mode: "editable" | "readonly";
  title?: string;

  initialUnit?: Unit;
  initialWeight?: number;

  fromPct?: number;
  toPct?: number;
  stepPct?: number;

  onChange?: (payload: ChangePayload) => void;
};

export function WeightCalculatorPanel({
  mode,
  title,
  initialUnit,
  initialWeight,
  fromPct = 125,
  toPct = 40,
  stepPct = 5,
  onChange,
}: Props) {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  // raw state (lo que el usuario “pide”)
  const [unit, setUnit] = useState<Unit>(initialUnit ?? "kg");
  const [rawWeight, setRawWeight] = useState<number>(initialWeight ?? 100);

  const [roundToPlates, setRoundToPlates] = useState(false);

  useEffect(() => {
    if (initialUnit) setUnit(initialUnit);
    if (typeof initialWeight === "number" && Number.isFinite(initialWeight)) {
      setRawWeight(initialWeight);
    }
  }, [initialUnit, initialWeight]);

  useEffect(() => {
    repo.getPreferences().then((p) => {
      setPrefs(p);
      if (!initialUnit) setUnit(p.defaultUnit);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectivePrefs = useMemo(() => {
    if (!prefs) return null;
    return prefsForUnit(prefs, unit);
  }, [prefs, unit]);

  const rounding = useMemo(() => {
    if (!effectivePrefs) return null;
    return nearestLoadableTotalUnlimited({
      targetTotal: rawWeight,
      unit,
      bar: effectivePrefs.bar,
      plates: effectivePrefs.plates,
    });
  }, [effectivePrefs, rawWeight, unit]);

  const displayWeight =
    roundToPlates && rounding && Number.isFinite(rounding.total)
      ? rounding.total
      : rawWeight;

  function emit(nextUnit: Unit, nextWeight: number) {
    onChange?.({ unit: nextUnit, weight: nextWeight });
  }

  function switchUnit(next: Unit) {
    if (next === unit) return;
    const converted = round1(convertWeightValue(rawWeight, unit, next));
    setUnit(next);
    setRawWeight(converted);
    // emit lo hará el effect de abajo al cambiar displayWeight
  }

  // URL/share state: emitimos el "displayWeight" (rounded si aplica)
  useEffect(() => {
    emit(unit, displayWeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, displayWeight]);

  if (!prefs || !effectivePrefs) return <p>{t.home.loading}</p>;

  const segmentedBtn = (active: boolean) =>
    ({
      padding: "10px 12px",
      border: "1px solid var(--border, #ddd)",
      background: active ? "var(--card, #fff)" : "transparent",
      opacity: active ? 1 : 0.75,
      fontWeight: 700,
      flex: 1,
    }) as const;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {title ? <h2 style={{ margin: 0 }}>{title}</h2> : null}

      <section
        style={{
          border: "1px solid var(--border, #ddd)",
          borderRadius: 14,
          padding: 12,
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <UnitSwitch value={unit} onChange={switchUnit} />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ContextBadge context={prefs.contexts[unit]} />
            <span style={{ opacity: 0.6, fontSize: 12 }}>
              default: {prefs.defaultUnit.toUpperCase()}
            </span>
          </div>
        </div>

        {mode === "editable" ? (
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>
              {t.home.maxWeight} ({unit})
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={rawWeight}
              onChange={(e) => setRawWeight(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid var(--border, #ddd)",
                fontSize: 16,
              }}
            />
          </label>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 12,
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 13, opacity: 0.8 }}>
                {t.home.maxWeight} ({unit})
              </span>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {displayWeight}{" "}
                <span style={{ fontSize: 14, opacity: 0.7 }}>{unit}</span>
              </div>
            </div>

            {roundToPlates && rounding ? (
              <div style={{ textAlign: "right", fontSize: 12, opacity: 0.75 }}>
                <div>nearest loadable</div>
                <div>
                  Δ {round1(rounding.delta)} {unit}
                </div>
              </div>
            ) : null}
          </div>
        )}

        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingTop: 2,
          }}
        >
          <span style={{ fontSize: 13 }}>Round to nearest plates</span>
          <input
            type="checkbox"
            checked={roundToPlates}
            onChange={(e) => setRoundToPlates(e.target.checked)}
            style={{ transform: "scale(1.1)" }}
          />
        </label>

        {roundToPlates && rounding && Number.isFinite(rounding.stepTotal) ? (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Step:{" "}
            <b>
              {round1(rounding.stepTotal)} {unit}
            </b>{" "}
            total
          </div>
        ) : null}
      </section>

      <PercentCards
        maxWeight={displayWeight}
        unit={unit}
        prefs={effectivePrefs}
        fromPct={fromPct}
        toPct={toPct}
        stepPct={stepPct}
      />
    </div>
  );
}
