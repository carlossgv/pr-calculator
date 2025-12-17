/* apps/web/src/components/PercentCards.tsx */
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

function platesPerSideLabel(
  load: ReturnType<typeof calculateLoad>,
  unit: Unit,
) {
  if (load.platesPerSide.length === 0) return "—";
  return load.platesPerSide
    .map((p) =>
      formatPickLabel(p.plate.label, p.plate.unit, p.valueInUnit, unit),
    )
    .join(" + ");
}

export function PercentCards({
  maxWeight,
  unit,
  prefs,
  fromPct = 125,
  toPct = 40,
  stepPct = 5,
}: Props) {
  const [selectedPct, setSelectedPct] = useState<number | null>(null);

  // mobile-only: reserve bottom space for the fixed detail
  const detailRef = useRef<HTMLElement | null>(null);
  const [detailSpacePx, setDetailSpacePx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 520px)");
    const update = () => setIsMobile(mq.matches);

    update();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }

    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  const cards = useMemo(() => {
    const out: Array<{
      pct: number;
      target: number;
      load: ReturnType<typeof calculateLoad>;
    }> = [];

    if (stepPct <= 0) return out;

    for (let p = fromPct; p >= toPct; p -= stepPct) {
      const target = (maxWeight * p) / 100;
      const load = calculateLoad(target, unit, prefs);
      out.push({ pct: p, target, load });
    }

    return out;
  }, [fromPct, toPct, stepPct, maxWeight, unit, prefs]);

  const selected = useMemo(() => {
    if (selectedPct == null) return null;
    return cards.find((c) => c.pct === selectedPct) ?? null;
  }, [cards, selectedPct]);

  function selectPct(pct: number) {
    setSelectedPct((prev) => (prev === pct ? null : pct));
  }

  useEffect(() => {
    if (!isMobile || !selected) {
      setDetailSpacePx(0);
      return;
    }

    const el = detailRef.current;
    if (!el) return;

    const EXTRA = 12;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      setDetailSpacePx(Math.ceil(h + EXTRA));
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);

    return () => ro.disconnect();
  }, [selected, isMobile]);

  return (
    <div
      className={styles.root}
      style={
        {
          ["--percent-detail-space" as any]: `${detailSpacePx}px`,
        } as React.CSSProperties
      }
    >
      {/* DETAIL (desktop inline; mobile fixed via CSS) */}
      {selected ? (
        <section ref={detailRef as any} className={styles.detail}>
          <div className={styles.detailTitle}>
            {selected.pct}% · {round1(selected.target)}
            {unit}
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

          <div className={[styles.detailRow, styles.detailClamp].join(" ")}>
            <b>{t.home.platesPerSide}:</b>{" "}
            {platesPerSideLabel(selected.load, unit)}
          </div>

          <div className={styles.detailRow}>
            <b>{t.home.perSideTotal}:</b> {round1(selected.load.perSide)}
            {unit}
          </div>

          <div className={styles.detailAchieved}>
            {t.home.achieved}: {round1(selected.load.achievedTotal)}
            {unit} (Δ {round1(selected.load.delta)}
            {unit})
          </div>
        </section>
      ) : null}

      {/* GRID */}
      <div className={styles.grid}>
        {cards.map(({ pct, target, load }) => {
          const isSelected = pct === selectedPct;
          const is100 = pct === 100;

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
