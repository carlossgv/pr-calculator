// apps/web/src/components/WeightCalculatorPanel.tsx
// FILE: apps/web/src/components/WeightCalculatorPanel.tsx
import { useEffect, useMemo, useState } from "react";
import type { Unit, UserPreferences } from "@repo/core";
import { convertWeightValue } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { PercentCards } from "../components/PercentCards";
import { prefsForUnit } from "../utils/equipment";
import { UnitSwitch } from "./UnitSwitch";
import styles from "./WeightCalculatorPanel.module.css";

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

function contextChipWord(ctx: unknown): string {
  const id =
    typeof ctx === "string"
      ? ctx
      : typeof ctx === "object" && ctx
        ? (ctx as any).id ?? (ctx as any).kind ?? (ctx as any).name
        : "";

  const s = String(id ?? "").toLowerCase();

  if (s.includes("cross")) return "crossfit";
  if (s.includes("olym")) return "olympics";
  if (s === "olympic") return "olympics";
  if (s === "crossfit") return "crossfit";

  return "context";
}

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
    emit(unit, rawWeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, rawWeight]);

  if (!prefs || !effectivePrefs) return <p>{t.home.loading}</p>;

  const contextWord = contextChipWord(prefs.contexts?.[unit]);

  return (
    <div className={styles.root}>
      {title ? <h2 style={{ margin: 0 }}>{title}</h2> : null}

      <section className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.utilLabel}>
            PR CALC <span className={styles.stamp}>LIVE</span>
          </span>

          <span className={styles.contextChip}>{contextWord}</span>
        </div>

        <div className={styles.barcodeRule} />

        <div className={styles.topRow}>
          <UnitSwitch value={unit} onChange={switchUnit} />
        </div>

        {mode === "editable" ? (
          <div className={styles.weightInputWrap}>
            <input
              className={styles.weightInput}
              type="number"
              inputMode="decimal"
              value={rawWeight}
              onChange={(e) => setRawWeight(Number(e.target.value))}
              aria-label={t.home.maxWeight}
            />
            <span className={styles.weightInputUnit} aria-hidden="true">
              {unit}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 34, fontWeight: 950 }}>
              {rawWeight} <span style={{ fontSize: 14, opacity: 0.9 }}>{unit}</span>
            </div>
          </div>
        )}

        {/* TODO: Reintroduce "Snap to plates" as an Advanced option or Preferences setting.
            It adds cognitive load on the Home flow; keep the quick calc clean. */}
      </section>

      <PercentCards
        maxWeight={rawWeight}
        unit={unit}
        prefs={effectivePrefs}
        fromPct={fromPct}
        toPct={toPct}
        stepPct={stepPct}
      />
    </div>
  );
}
