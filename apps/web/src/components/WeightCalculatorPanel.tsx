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
import { Plus } from "lucide-react";
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

function parsePctInput(s: string): number | null {
  const v = Number(String(s).replace("%", "").trim());
  if (!Number.isFinite(v)) return null;
  if (v <= 0 || v > 300) return null;
  return Math.round(v * 10) / 10;
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

  const [customPctInput, setCustomPctInput] = useState<string>("");
  const [customPcts, setCustomPcts] = useState<number[]>([]);

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

  function addCustomPct() {
    const v = parsePctInput(customPctInput);
    if (v == null) return;

    setCustomPcts((prev) => {
      if (prev.some((x) => Math.abs(x - v) < 0.0001)) return prev;
      const next = [...prev, v].sort((a, b) => b - a);
      return next.slice(0, 8);
    });

    setCustomPctInput("");
  }

  function removeCustomPct(v: number) {
    setCustomPcts((prev) => prev.filter((x) => Math.abs(x - v) > 0.0001));
  }

  const canAdd = parsePctInput(customPctInput) != null;

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
      </section>

      <section className={styles.customPct} aria-label={t.home.customPercent}>
        <div className={styles.customPctTop}>
          <div className={styles.customPctTitle}>{t.home.customPercent}</div>

          <div className={styles.customPctInputRow}>
            <input
              className={styles.customPctInput}
              type="number"
              inputMode="decimal"
              placeholder={t.home.customPercentPlaceholder}
              value={customPctInput}
              onChange={(e) => setCustomPctInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustomPct();
              }}
              aria-label={t.home.customPercent}
            />

            <button
              type="button"
              className={styles.customPctAddBtn}
              onClick={addCustomPct}
              disabled={!canAdd}
              aria-label={t.home.customPercentAddAria}
              title={t.home.customPercentAdd}
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {customPcts.length ? (
          <div className={styles.customPctChips} aria-label={t.home.customPercentAdded}>
            {customPcts.map((p) => (
              <button
                key={p}
                type="button"
                className={styles.customPctChip}
                onClick={() => removeCustomPct(p)}
                title={t.home.customPercentRemove}
                aria-label={`${t.home.customPercentRemove} ${p}%`}
              >
                <span>{p}%</span>
                <span className={styles.customPctChipX} aria-hidden="true">
                  ×
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.customPctHint}>{t.home.customPercentHint}</div>
        )}
      </section>

      <PercentCards
        maxWeight={rawWeight}
        unit={unit}
        prefs={effectivePrefs}
        fromPct={fromPct}
        toPct={toPct}
        stepPct={stepPct}
        extraPcts={customPcts}
      />
    </div>
  );
}
