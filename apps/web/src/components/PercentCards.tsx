// FILE: apps/web/src/components/PercentCards.tsx
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { calculateLoad, type Unit, type UserPreferences } from "@repo/core";
import { t } from "../i18n/strings";
import styles from "./PercentCards.module.css";
import { ChevronRight, X } from "lucide-react";
import { Button } from "../ui/Button";

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
  { value: 2.5, color: "#e53935", text: "#fefefe" },
  { value: 2, color: "#1e88e5", text: "#fefefe" },
  { value: 1.5, color: "#fdd835", text: "#1a1a1a" },
  { value: 1, color: "#43a047", text: "#fefefe" },
  { value: 0.5, color: "#f5f5f5", text: "#1a1a1a" },
];

function getKgPlateColor(valueKg: number) {
  let best = KG_PLATE_COLORS[0];
  for (const c of KG_PLATE_COLORS) {
    if (Math.abs(valueKg - c.value) < Math.abs(valueKg - best.value)) best = c;
  }
  return { color: best.color, text: best.text };
}

const LB_PLATE_COLORS: Array<{
  value: number;
  color: string;
  text: string;
}> = [
  { value: 45, color: "#1e88e5", text: "#fefefe" },
  { value: 35, color: "#fdd835", text: "#1a1a1a" },
  { value: 25, color: "#43a047", text: "#fefefe" },
  { value: 10, color: "#f5f5f5", text: "#1a1a1a" },
];

function getLbPlateColor(valueLb: number, maxLb: number) {
  const mapped = LB_PLATE_COLORS.find((plate) => plate.value === valueLb);
  if (mapped) return { color: mapped.color, text: mapped.text };
  const t = maxLb > 0 ? Math.min(1, valueLb / maxLb) : 0;
  const lightness = Math.round(78 - t * 38);
  const text = lightness > 60 ? "#1a1a1a" : "#f7f7f7";
  return { color: `hsl(0 0% ${lightness}%)`, text };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getGroupedPlateWidth(
  unit: Unit,
  plateUnit: Unit,
  valueInUnit: number,
  plateValue: number,
) {
  if (plateUnit === "kg") {
    if (plateValue === 25) return 46;
    if (plateValue === 20) return 42;
    if (plateValue === 10) return 35;
    if (plateValue === 5) return 26;
  }

  if (unit === "lb" && plateUnit === "lb") {
    if (valueInUnit === 45) return 46;
    if (valueInUnit === 25) return 35;
    if (valueInUnit === 10) return 26;
  }

  return clamp(valueInUnit * 1.4, 26, 46);
}

function getGroupedPlateHeight(unit: Unit, valueInUnit: number) {
  const isFractional = unit === "lb" ? valueInUnit <= 10 : valueInUnit < 5;
  if (isFractional) {
    const minHeight = 72;
    const maxHeight = 98;
    const minWeight = unit === "lb" ? 2.5 : 0.5;
    const maxWeight = unit === "lb" ? 10 : 5;
    const t = clamp(
      (valueInUnit - minWeight) / (maxWeight - minWeight),
      0,
      1,
    );
    return minHeight + t * (maxHeight - minHeight);
  }

  const minHeight = 110;
  const maxHeight = 140;
  const [minWeight, maxWeight] = unit === "lb" ? [10, 45] : [5, 25];
  const t = clamp(
    (valueInUnit - minWeight) / (maxWeight - minWeight),
    0,
    1,
  );
  const mapped =
    unit === "lb"
      ? minHeight + t * (maxHeight - minHeight)
      : 115 + t * (maxHeight - 115);
  return clamp(mapped, minHeight, maxHeight);
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

  const groupedStylePlates = useMemo(() => {
    if (!selected?.load.platesPerSide.length) return [];

    const maxLbValue = selected.load.platesPerSide.reduce(
      (max, p) =>
        p.plate.unit === "lb" ? Math.max(max, p.plate.value) : max,
      0,
    );

    return selected.load.platesPerSide
      .map((p, index) => {
        const palette =
          p.plate.unit === "kg"
            ? getKgPlateColor(p.plate.value)
            : getLbPlateColor(p.plate.value, maxLbValue);
        const width = getGroupedPlateWidth(
          unit,
          p.plate.unit,
          p.valueInUnit,
          p.plate.value,
        );
        const height =
          unit === "lb" && p.plate.unit === "lb"
            ? 140
            : getGroupedPlateHeight(
                p.plate.unit === "kg" ? "kg" : unit,
                p.plate.unit === "kg" ? p.plate.value : p.valueInUnit,
              );
        return {
          id: `${p.plate.unit}-${p.plate.value}-${index}`,
          width,
          height,
          valueInUnit: p.valueInUnit,
          text: `${p.plate.value}`,
          label: formatPickLabel(
            p.plate.label,
            p.plate.unit,
            p.valueInUnit,
            unit,
          ),
          color: palette.color,
          textColor: palette.text,
        };
      })
      .sort((a, b) => b.valueInUnit - a.valueInUnit);
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

  const detailTitle = selected
    ? `${selected.pct}% · ${round1(selected.target)}${unit}`
    : "";

  const detailContent = selected ? (
    <>
      <div className={styles.detailPrimary}>
        <div className={styles.detailKpiLabel}>{t.home.platesPerSide}</div>
        <div className={styles.plateCombo}>
          <div
            className={[styles.detailKpiValue, styles.detailClamp].join(" ")}
          >
            {platesPerSideLabel(selected.load, unit)}
          </div>
          {groupedStylePlates.length ? (
            <div
              className={[styles.plateBar, styles.plateBarGrouped].join(" ")}
              role="img"
              aria-label={platesPerSideLabel(selected.load, unit)}
            >
              <div className={styles.barCore} aria-hidden="true">
                <span className={styles.barShaft} />
                <span className={styles.barSleeve} />
              </div>
              <div className={[styles.barPlates, styles.barPlatesGrouped].join(" ")}>
                {groupedStylePlates.map((plate) => (
                  <span
                    key={plate.id}
                    className={styles.plateGroupBlock}
                    style={
                      {
                        "--plate-group-width": `${plate.width}px`,
                        "--plate-group-height": `${plate.height}px`,
                        "--plate-color": plate.color,
                        "--plate-text": plate.textColor,
                      } as CSSProperties
                    }
                    title={plate.label}
                    aria-label={plate.label}
                  >
                    <span className={styles.plateGroupText} aria-hidden="true">
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

      <div className={styles.detailFacts}>
        <div className={styles.detailFactRow}>
          <div className={styles.detailFactLabel}>{t.home.perSideTotal}</div>
          <div className={styles.detailFactValue}>
            {round1(selected.load.perSide)}
            {unit}
          </div>
        </div>

        <div className={styles.detailFactRow}>
          <div className={styles.detailFactLabel}>{t.home.bar}</div>
          <div className={[styles.detailFactValue, styles.detailClamp].join(" ")}>
            {formatPickLabel(
              selected.load.bar.plate.label,
              selected.load.bar.plate.unit,
              selected.load.bar.valueInUnit,
              unit,
            )}
          </div>
        </div>

        <div className={`${styles.detailFactRow} ${styles.detailFactRowEmphasis}`}>
          <div className={styles.detailFactLabel}>{t.home.achieved}</div>
          <div className={styles.detailFactValue}>
            {round1(selected.load.achievedTotal)}
            {unit} (Δ {round1(selected.load.delta)}
            {unit})
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className={styles.root}>
      {selected ? (
        <section ref={detailRef as any} className={styles.detail}>
          <div className={styles.detailTitle}>{detailTitle}</div>
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
          <section className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.detailTitle}>{detailTitle}</div>
              <Button
                variant="ghost"
                size="md"
                shape="round"
                iconOnly
                className={styles.modalClose}
                onClick={close}
                ariaLabel={t.movements.closeAria}
                title={t.movements.closeAria}
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </div>

            <div className={styles.modalBody}>{detailContent}</div>
          </section>
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

          const targetLabel = `${round1(target)} ${unit}`;
          const targetSize =
            targetLabel.length >= 8 ? "sm" : targetLabel.length >= 7 ? "md" : "lg";

          return (
            <button
              key={pct}
              type="button"
              className={className}
              onClick={() => selectPct(pct)}
              aria-pressed={isSelected}
            >
              <div className={styles.tileRow}>
                <div className={styles.leftTop}>
                  <div className={styles.pct}>{pct}%</div>
                  <div className={styles.target} data-size={targetSize}>
                    {targetLabel}
                  </div>
                </div>

                <span className={styles.chevronPill} aria-hidden="true">
                  <ChevronRight size={18} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
