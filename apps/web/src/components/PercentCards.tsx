// apps/web/src/components/PercentCards.tsx
// FILE: apps/web/src/components/PercentCards.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { calculateLoad, type Unit, type UserPreferences } from "@repo/core";
import { t } from "../i18n/strings";
import styles from "./PercentCards.module.css";

type Props = {
  maxWeight: number;
  unit: Unit;
  prefs: UserPreferences;
  fromPct?: number;
  toPct?: number;
  stepPct?: number;

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

function normalizeExtraPcts(extraPcts: number[] | undefined) {
  if (!extraPcts?.length) return [];
  // basic guardrails + normalize to 0.1
  const cleaned = extraPcts
    .map((x) => Math.round(Number(x) * 10) / 10)
    .filter((x) => Number.isFinite(x) && x > 0 && x <= 300);

  // de-dupe
  const out: number[] = [];
  for (const p of cleaned) {
    if (!out.some((v) => Math.abs(v - p) < 0.0001)) out.push(p);
  }

  // keep it sane for UI
  return out.slice(0, 8).sort((a, b) => b - a);
}

export function PercentCards({
  maxWeight,
  unit,
  prefs,
  fromPct = 125,
  toPct = 40,
  stepPct = 5,
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

    // Build base percent list
    const basePcts: number[] = [];
    for (let p = fromPct; p >= toPct; p -= stepPct) basePcts.push(p);

    // Merge (extras first), de-dupe, keep descending
    const merged: number[] = [];
    const pushUnique = (p: number) => {
      if (!merged.some((x) => Math.abs(x - p) < 0.0001)) merged.push(p);
    };

    for (const p of extras) pushUnique(p);
    for (const p of basePcts) pushUnique(p);

    // Sort desc so extras integrate nicely (and don’t appear randomly)
    merged.sort((a, b) => b - a);

    for (const p of merged) {
      const target = (maxWeight * p) / 100;
      const load = calculateLoad(target, unit, prefs);
      out.push({ pct: p, target, load });
    }

    return out;
  }, [fromPct, toPct, stepPct, maxWeight, unit, prefs, extraPcts]);

  const selected = useMemo(() => {
    if (selectedPct == null) return null;
    return cards.find((c) => Math.abs(c.pct - selectedPct) < 0.0001) ?? null;
  }, [cards, selectedPct]);

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
        <div className={[styles.detailKpiValue, styles.detailClamp].join(" ")}>
          {platesPerSideLabel(selected.load, unit)}
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
        {cards.map(({ pct, target, load }) => {
          const isSelected = selectedPct != null && Math.abs(pct - selectedPct) < 0.0001;
          const is100 = Math.abs(pct - 100) < 0.0001;

          // FIX: actually apply the styles that exist in CSS
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
              <div className={styles.tileTop}>
                <div className={styles.pct}>
                  {pct}%{" "}
                  {is100 ? <span className={styles.pctHint}>(MAX)</span> : null}
                </div>

                <div className={styles.target}>
                  {round1(target)}
                  {unit}
                </div>
              </div>

              <div className={styles.meta}>
                <b>{t.home.platesPerSide}:</b> {platesPerSideLabel(load, unit)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
