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
import { Switch } from "./Switch";

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
  }

  useEffect(() => {
    emit(unit, displayWeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, displayWeight]);

  if (!prefs || !effectivePrefs) return <p>{t.home.loading}</p>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {title ? <h2 style={{ margin: 0 }}>{title}</h2> : null}

      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 12,
          display: "grid",
          gap: 12,
        }}
      >
        {/* Row 1: unit + context */}
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

          <ContextBadge context={prefs.contexts[unit]} />
        </div>

        {/* Weight */}
        {mode === "editable" ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                Max
              </span>
              <span style={{ fontSize: 12, opacity: 0.6 }}>
                100%
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <input
                className="weightInput"
                type="number"
                inputMode="decimal"
                value={rawWeight}
                onChange={(e) => setRawWeight(Number(e.target.value))}
              />
            </div>
          </div>
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
                Max · 100%
              </span>
              <div style={{ fontSize: 26, fontWeight: 900 }}>
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

        {/* Round row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              Round to nearest plates
            </span>
            {roundToPlates &&
            rounding &&
            Number.isFinite(rounding.stepTotal) ? (
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                step {round1(rounding.stepTotal)} {unit} total
              </span>
            ) : (
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                match your available plates
              </span>
            )}
          </div>

          <Switch
            checked={roundToPlates}
            onCheckedChange={setRoundToPlates}
            ariaLabel="Round to nearest plates"
          />
        </div>
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
