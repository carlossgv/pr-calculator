// FILE: apps/web/src/components/PercentCards.tsx
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { calculateLoad, type Unit, type UserPreferences } from "@repo/core";
import { t } from "../i18n/strings";
import styles from "./PercentCards.module.css";
import { ChevronRight } from "lucide-react";

export type PercentOrder = "asc" | "desc";

type Props = {
  maxWeight: number;
  unit: Unit;
  prefs: UserPreferences;
  fromPct?: number;
  toPct?: number;
  stepPct?: number;
  order?: PercentOrder;

  /** Extra %s (ephemeral) injected by the parent (not persisted). */
  extraPcts?: number[];
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function formatPickLabel(
  originalLabel: string | undefined,
  originalUnit: Unit,
  valueInUnit: number,
  unit: Unit,
) {
  if (originalUnit !== unit) {
    const base = originalLabel?.trim()
      ? originalLabel
      : `${round1(valueInUnit)} ${unit}`;
    return `${base} (${round1(valueInUnit)} ${unit})`;
  }
  return originalLabel?.trim()
    ? originalLabel
    : `${round1(valueInUnit)} ${unit}`;
}

function platesPerSideLabel(load: ReturnType<typeof calculateLoad>, unit: Unit) {
  if (load.platesPerSide.length === 0) return "—";
  return load.platesPerSide
    .map((p) =>
      formatPickLabel(p.plate.label, p.plate.unit, p.valueInUnit, unit),
    )
    .join(" + ");
}

const KG_PLATE_COLORS: Array<{
  value: number;
  color: string;
  text: string;
}> = [
  { value: 25, color: "#e53935", text: "#fefefe" },
  { value: 20, color: "#1e88e5", text: "#fefefe" },
  { value: 15, color: "#fdd835", text: "#1a1a1a" },
  { value: 10, color: "#43a047", text: "#fefefe" },
  { value: 5, color: "#f5f5f5", text: "#1a1a1a" },
  { value: 2.5, color: "#d32f2f", text: "#fefefe" },
  { value: 2, color: "#1e88e5", text: "#fefefe" },
  { value: 1.5, color: "#fdd835", text: "#1a1a1a" },
  { value: 1, color: "#111111", text: "#f5f5f5" },
  { value: 0.5, color: "#1e88e5", text: "#fefefe" },
];

function getKgPlateColor(valueKg: number) {
  let best = KG_PLATE_COLORS[0];
  for (const c of KG_PLATE_COLORS) {
    if (Math.abs(valueKg - c.value) < Math.abs(valueKg - best.value)) best = c;
  }
  return { color: best.color, text: best.text };
}

function getLbPlateColor(valueLb: number, maxLb: number) {
  const t = maxLb > 0 ? Math.min(1, valueLb / maxLb) : 0;
  const lightness = Math.round(78 - t * 38);
  const text = lightness > 60 ? "#1a1a1a" : "#f7f7f7";
  return { color: `hsl(0 0% ${lightness}%)`, text };
}

function getPlateDiameter(unit: Unit, value: number) {
  if (unit === "lb") return 72;
  if (value >= 10) return 74;
  if (value >= 5) return 62;
  if (value >= 1.5) return 52;
  if (value >= 1) return 44;
  return 36;
}

function getPlateThickness(unit: Unit, value: number) {
  if (unit === "lb") {
    if (value >= 45) return 18;
    if (value >= 35) return 16;
    if (value >= 25) return 14;
    if (value >= 10) return 12;
    if (value >= 5) return 10;
    return 9;
  }

  if (value >= 25) return 18;
  if (value >= 20) return 17;
  if (value >= 15) return 16;
  if (value >= 10) return 14;
  if (value >= 5) return 12;
  if (value >= 2) return 9;
  if (value >= 1.5) return 8;
  if (value >= 1) return 7;
  return 6;
}

function normalizeExtraPcts(extraPcts: number[] | undefined) {
  if (!extraPcts?.length) return [];

  const cleaned = extraPcts
    .map((x) => Math.round(Number(x) * 10) / 10)
    .filter((x) => Number.isFinite(x) && x > 0 && x <= 300);

  const out: number[] = [];
  for (const p of cleaned) {
    if (!out.some((v) => Math.abs(v - p) < 0.0001)) out.push(p);
  }

  return out.slice(0, 8);
}

export function PercentCards({
  maxWeight,
  unit,
  prefs,
  fromPct = 125,
  toPct = 40,
  stepPct = 5,
  order = "desc",
  extraPcts,
}: Props) {
  const [selectedPct, setSelectedPct] = useState<number | null>(null);

  const detailRef = useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 520px)");

    const update = (ev?: MediaQueryListEvent) => {
      setIsMobile(ev ? ev.matches : mq.matches);
    };

    update();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }

    (mq as any).addListener(update);
    return () => (mq as any).removeListener(update);
  }, []);

  const cards = useMemo(() => {
    const out: Array<{
      pct: number;
      target: number;
      load: ReturnType<typeof calculateLoad>;
    }> = [];

    if (stepPct <= 0) return out;

    const extras = normalizeExtraPcts(extraPcts);

    const basePcts: number[] = [];
    for (let p = fromPct; p >= toPct; p -= stepPct) basePcts.push(p);

    const merged: number[] = [];
    const pushUnique = (p: number) => {
      if (!merged.some((x) => Math.abs(x - p) < 0.0001)) merged.push(p);
    };

    for (const p of extras) pushUnique(p);
    for (const p of basePcts) pushUnique(p);

    const dir = order === "asc" ? 1 : -1;
    merged.sort((a, b) => (a - b) * dir);

    for (const p of merged) {
      const target = (maxWeight * p) / 100;
      const load = calculateLoad(target, unit, prefs);
      out.push({ pct: p, target, load });
    }

    return out;
  }, [fromPct, toPct, stepPct, maxWeight, unit, prefs, extraPcts, order]);

  const selected = useMemo(() => {
    if (selectedPct == null) return null;
    return cards.find((c) => Math.abs(c.pct - selectedPct) < 0.0001) ?? null;
  }, [cards, selectedPct]);

  const plateVisuals = useMemo(() => {
    if (!selected?.load.platesPerSide.length) return [];

    const maxLbValue = selected.load.platesPerSide.reduce(
      (max, p) =>
        p.plate.unit === "lb" ? Math.max(max, p.plate.value) : max,
      0,
    );

    return selected.load.platesPerSide.map((p, index) => {
      const palette =
        p.plate.unit === "kg"
          ? getKgPlateColor(p.plate.value)
          : getLbPlateColor(p.plate.value, maxLbValue);

      const size = getPlateDiameter(p.plate.unit, p.plate.value);
      const thickness = getPlateThickness(p.plate.unit, p.plate.value);

      return {
        id: `${p.plate.unit}-${p.plate.value}-${index}`,
        size,
        thickness,
        color: palette.color,
        textColor: palette.text,
        text: `${p.plate.value}`,
        label: formatPickLabel(
          p.plate.label,
          p.plate.unit,
          p.valueInUnit,
          unit,
        ),
      };
    });
  }, [selected, unit]);

  function selectPct(pct: number) {
    setSelectedPct((prev) =>
      prev != null && Math.abs(prev - pct) < 0.0001 ? null : pct,
    );
  }

  function close() {
    setSelectedPct(null);
  }

  useEffect(() => {
    if (!selected) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const detailContent = selected ? (
    <>
      <div className={styles.detailTitle}>
        {selected.pct}% · {round1(selected.target)}
        {unit}
      </div>

      <div className={styles.detailKpi}>
        <div className={styles.detailKpiLabel}>{t.home.platesPerSide}</div>
        <div className={styles.plateCombo}>
          <div
            className={[styles.detailKpiValue, styles.detailClamp].join(" ")}
          >
            {platesPerSideLabel(selected.load, unit)}
          </div>
          {plateVisuals.length ? (
            <div
              className={styles.plateBar}
              role="img"
              aria-label={platesPerSideLabel(selected.load, unit)}
            >
              <span className={styles.barShaft} aria-hidden="true" />
              <span className={styles.barSleeve} aria-hidden="true" />
              <div className={styles.barPlates}>
                {plateVisuals.map((plate) => (
                  <span
                    key={plate.id}
                    className={styles.plateBlock}
                    style={
                      {
                        "--plate-size": `${plate.size}px`,
                        "--plate-thickness": `${plate.thickness}px`,
                        "--plate-color": plate.color,
                        "--plate-text": plate.textColor,
                      } as CSSProperties
                    }
                    title={plate.label}
                    aria-label={plate.label}
                  >
                    <span className={styles.plateLabel} aria-hidden="true">
                      {plate.text}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.plateEmpty}>—</div>
          )}
        </div>
      </div>

      <div className={styles.detailKpi}>
        <div className={styles.detailKpiLabel}>{t.home.perSideTotal}</div>
        <div className={styles.detailKpiValue}>
          {round1(selected.load.perSide)}
          {unit}
        </div>
      </div>

      <div className={styles.detailRow}>
        <b>{t.home.bar}:</b>{" "}
        {formatPickLabel(
          selected.load.bar.plate.label,
          selected.load.bar.plate.unit,
          selected.load.bar.valueInUnit,
          unit,
        )}
      </div>

      <div className={styles.detailAchieved}>
        {t.home.achieved}: {round1(selected.load.achievedTotal)}
        {unit} (Δ {round1(selected.load.delta)}
        {unit})
      </div>
    </>
  ) : null;

  return (
    <div className={styles.root}>
      {selected ? (
        <section ref={detailRef as any} className={styles.detail}>
          {detailContent}
        </section>
      ) : null}

      {isMobile && selected ? (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Percent detail"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <section className={styles.modal}>{detailContent}</section>
        </div>
      ) : null}

      <div className={styles.grid}>
        {cards.map(({ pct, target }) => {
          const isSelected =
            selectedPct != null && Math.abs(pct - selectedPct) < 0.0001;
          const is100 = Math.abs(pct - 100) < 0.0001;

          const className = [
            styles.tile,
            is100 ? styles.tileMax : "",
            isSelected ? styles.tileSelected : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={pct}
              type="button"
              className={className}
              onClick={() => selectPct(pct)}
              aria-pressed={isSelected}
            >
              <div className={styles.tileRow}>
                <div className={styles.pct}>
                  {pct}%{" "}
                  {is100 ? <span className={styles.pctHint}>(MAX)</span> : null}
                </div>

                <div className={styles.rightTop}>
                  <div className={styles.target}>
                    {round1(target)}
                    {unit}
                  </div>

                  <span className={styles.chevronPill} aria-hidden="true">
                    <ChevronRight size={18} />
                  </span>
                </div>
              </div>

              {/* sin texto: solo “detalle” visual */}
              <div className={styles.tileRule} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
