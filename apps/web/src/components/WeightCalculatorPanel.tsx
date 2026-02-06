// FILE: apps/web/src/components/WeightCalculatorPanel.tsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Unit, UserPreferences } from "@repo/core";
import { convertWeightValue } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { PercentCards, type PercentOrder } from "../components/PercentCards";
import { prefsForUnit } from "../utils/equipment";
import { UnitSwitch } from "./UnitSwitch";
import { ArrowUpDown, Plus } from "lucide-react";
import styles from "./WeightCalculatorPanel.module.css";
import { Button } from "../ui/Button";
import { Surface } from "../ui/Surface";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function formatWeight(n: number) {
  return Number.isFinite(n) ? String(n) : "0";
}

function sanitizeWeightText(input: string) {
  if (input === "") return "";

  let s = input.replace(",", ".");
  let out = "";
  let sawDot = false;

  for (const ch of s) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch === "." && !sawDot) {
      out += ".";
      sawDot = true;
    }
  }

  if (out.startsWith(".")) out = `0${out}`;

  if (!out.startsWith("0.")) {
    out = out.replace(/^0+(?=\d)/, "");
  }

  const hadDot = out.includes(".");
  const endsWithDot = out.endsWith(".");
  const parts = out.replace(/\.$/, "").split(".");
  let intPart = parts[0] ?? "";
  let fracPart = parts[1] ?? "";

  if (intPart.length > 4) intPart = intPart.slice(0, 4);
  if (fracPart.length > 1) fracPart = fracPart.slice(0, 1);

  let next = intPart;
  if (hadDot && (endsWithDot || fracPart.length)) {
    next = `${intPart}.${fracPart}`;
    if (endsWithDot && fracPart.length === 0) next = `${intPart}.`;
  }

  if (next === "") next = "0";
  return next;
}

type ChangePayload = { unit: Unit; weight: number };

type Props = {
  mode: "editable" | "readonly";
  title?: string;

  initialUnit?: Unit;
  initialWeight?: number;

  /** Quick-mode extras (local-only persistence lives in the page) */
  initialCustomPcts?: number[];
  onCustomPctsChange?: (pcts: number[]) => void;

  initialPctOrder?: PercentOrder;
  onPctOrderChange?: (order: PercentOrder) => void;

  fromPct?: number;
  toPct?: number;
  stepPct?: number;

  onChange?: (payload: ChangePayload) => void;

  /** NEW: if present, we're in "theoretical PR" mode and we show a hint/banner */
  theoreticalFrom?: {
    baseWeight: number;
    baseReps: number;
  };
};

function contextChipWord(ctx: unknown): string {
  const id =
    typeof ctx === "string"
      ? ctx
      : typeof ctx === "object" && ctx
        ? ((ctx as any).id ?? (ctx as any).kind ?? (ctx as any).name)
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

function sortPcts(pcts: number[], order: PercentOrder): number[] {
  const dir = order === "asc" ? 1 : -1;
  return [...pcts].sort((a, b) => (a - b) * dir);
}

function sanitizePcts(pcts: unknown, order: PercentOrder): number[] {
  if (!Array.isArray(pcts)) return [];
  const out: number[] = [];
  for (const x of pcts) {
    const n = Number(x);
    if (!Number.isFinite(n)) continue;
    const v = Math.round(n * 10) / 10;
    if (v <= 0 || v > 300) continue;
    if (out.some((k) => Math.abs(k - v) < 0.0001)) continue;
    out.push(v);
  }
  return sortPcts(out, order).slice(0, 8);
}

export function WeightCalculatorPanel({
  mode,
  title,
  initialUnit,
  initialWeight,
  initialCustomPcts,
  onCustomPctsChange,
  initialPctOrder,
  onPctOrderChange,
  fromPct = 125,
  toPct = 40,
  stepPct = 5,
  onChange,
  theoreticalFrom,
}: Props) {
  const weightInputRef = useRef<HTMLInputElement | null>(null);
  const [weightSize, setWeightSize] = useState<"lg" | "md" | "sm">("lg");
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [unit, setUnit] = useState<Unit>(initialUnit ?? "kg");
  const [rawWeight, setRawWeight] = useState<number>(initialWeight ?? 100);

  const [weightText, setWeightText] = useState<string>(
    formatWeight(initialWeight ?? 100),
  );

  const [customPctInput, setCustomPctInput] = useState<string>("");
  const [pctOrder, setPctOrder] = useState<PercentOrder>(
    initialPctOrder ?? "desc",
  );
  const [customPcts, setCustomPcts] = useState<number[]>(
    sanitizePcts(initialCustomPcts, initialPctOrder ?? "desc"),
  );
  const onPctOrderChangeRef = useRef(onPctOrderChange);
  const orderReadyRef = useRef(false);
  const manualOrderRef = useRef(false);

  useEffect(() => {
    onPctOrderChangeRef.current = onPctOrderChange;
  }, [onPctOrderChange]);

  useEffect(() => {
    if (initialUnit) setUnit(initialUnit);
    if (typeof initialWeight === "number" && Number.isFinite(initialWeight)) {
      setRawWeight(initialWeight);
      setWeightText(formatWeight(initialWeight));
    }
  }, [initialUnit, initialWeight]);

  useEffect(() => {
    let cancelled = false;
    if (initialPctOrder) {
      orderReadyRef.current = true;
      setPctOrder(initialPctOrder);
      return;
    }

    repo.getPercentOrder().then((order) => {
      if (cancelled || manualOrderRef.current) return;
      orderReadyRef.current = true;
      setPctOrder(order);
    });

    return () => {
      cancelled = true;
    };
  }, [initialPctOrder]);

  useEffect(() => {
    setCustomPcts(sanitizePcts(initialCustomPcts, pctOrder));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialCustomPcts ?? [])]);

  useEffect(() => {
    repo.getPreferences().then((p) => {
      setPrefs(p);
      if (!initialUnit) setUnit(p.defaultUnit);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const el = weightInputRef.current;
    if (!el) return;

    const check = () => {
      const max = el.clientWidth;
      const needed = el.scrollWidth;
      const next = needed > max * 1.18 ? "sm" : needed > max * 1.02 ? "md" : "lg";
      setWeightSize((prev) => (prev === next ? prev : next));
    };

    check();

    if (typeof window === "undefined" || !("ResizeObserver" in window)) {
      const id = setTimeout(check, 0);
      return () => clearTimeout(id);
    }

    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [weightText, unit, mode]);

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
    setWeightText(formatWeight(converted));
  }

  useEffect(() => {
    emit(unit, rawWeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, rawWeight]);

  useEffect(() => {
    onCustomPctsChange?.(customPcts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(customPcts)]);

  useEffect(() => {
    setCustomPcts((prev) => sortPcts(prev, pctOrder));
    onPctOrderChangeRef.current?.(pctOrder);
    if (orderReadyRef.current) repo.setPercentOrder(pctOrder);
  }, [pctOrder]);

  function addCustomPct() {
    const v = parsePctInput(customPctInput);
    if (v == null) return;

    setCustomPcts((prev) => {
      if (prev.some((x) => Math.abs(x - v) < 0.0001)) return prev;
      const next = sortPcts([...prev, v], pctOrder);
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

  const theoreticalHint =
    theoreticalFrom && theoreticalFrom.baseWeight > 0 && theoreticalFrom.baseReps > 0
      ? {
          label: t.movement.theoreticalModeTitle,
          sub: t.movement.theoreticalModeFrom
            .replace("{weight}", String(theoreticalFrom.baseWeight))
            .replace("{reps}", String(theoreticalFrom.baseReps))
            .replace("{unit}", unit),
        }
      : null;

  return (
    <div className={styles.root}>
      {title ? <h2 style={{ margin: 0 }}>{title}</h2> : null}

      <Surface variant="panel" className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.utilLabel}>
            PR CALC{" "}
            <span className={styles.stamp}>
              {theoreticalHint ? "THEORY" : "LIVE"}
            </span>
          </span>

          <span className={styles.contextChip}>{contextWord}</span>
        </div>

        {theoreticalHint ? (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid color-mix(in oklab, var(--accent) 35%, var(--border))",
              background:
                "color-mix(in oklab, var(--accent) 8%, var(--card-bg))",
              display: "grid",
              gap: 4,
            }}
            role="note"
            aria-label={theoreticalHint.label}
          >
            <div style={{ fontWeight: 950, letterSpacing: 0.2 }}>
              {theoreticalHint.label}
            </div>
            <div style={{ opacity: 0.85, fontSize: 13 }}>
              {theoreticalHint.sub}
            </div>
          </div>
        ) : null}

        <div className={styles.barcodeRule} />

        <div className={styles.topRow}>
          <UnitSwitch value={unit} onChange={switchUnit} />
          <div className={styles.topActions}>
            <Button
              variant="ghost"
              size="sm"
              shape="round"
              iconOnly
              onClick={() => {
                manualOrderRef.current = true;
                orderReadyRef.current = true;
                setPctOrder((prev) => (prev === "asc" ? "desc" : "asc"));
              }}
              ariaLabel={t.home.percentOrderAria}
              title={`${t.home.percentOrderTitle}: ${
                pctOrder === "asc"
                  ? t.home.percentOrderAsc
                  : t.home.percentOrderDesc
              }`}
            >
              <ArrowUpDown size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>

        {mode === "editable" ? (
          <div className={styles.weightInputWrap}>
            <input
              className={styles.weightInput}
              data-size={weightSize}
              ref={weightInputRef}
              type="text"
              inputMode="decimal"
              value={weightText}
              onChange={(e) => {
                const nextText = sanitizeWeightText(e.target.value);
                setWeightText(nextText);

                if (nextText === "") return;

                const n = Number(nextText);
                if (Number.isFinite(n)) setRawWeight(n);
              }}
              onBlur={() => {
                if (weightText.trim() === "") {
                  setWeightText("0");
                  setRawWeight(0);
                  return;
                }

                const normalized = sanitizeWeightText(weightText);
                setWeightText(normalized);

                const n = Number(normalized);
                if (Number.isFinite(n)) setRawWeight(n);
              }}
              aria-label={t.home.maxWeight}
            />
            <span className={styles.weightInputUnit} aria-hidden="true">
              {unit}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 34, fontWeight: 950 }}>
              {rawWeight}{" "}
              <span style={{ fontSize: 14, opacity: 0.9 }}>{unit}</span>
            </div>
          </div>
        )}
      </Surface>

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

            <Button
              variant="primary"
              size="lg"
              shape="round"
              iconOnly
              disabled={!canAdd}
              onClick={addCustomPct}
              ariaLabel={t.home.customPercentAddAria}
              title={t.home.customPercentAdd}
            >
              <Plus size={18} aria-hidden="true" />
            </Button>
          </div>
        </div>

        {customPcts.length ? (
          <div className={styles.customPctChips} aria-label={t.home.customPercentAdded}>
            {customPcts.map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                shape="pill"
                className={styles.customPctChip}
                onClick={() => removeCustomPct(p)}
                title={t.home.customPercentRemove}
                ariaLabel={`${t.home.customPercentRemove} ${p}%`}
              >
                <span>{p}%</span>
                <span className={styles.customPctChipX} aria-hidden="true">
                  ×
                </span>
              </Button>
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
        order={pctOrder}
        extraPcts={customPcts}
      />
    </div>
  );
}
