// apps/web/src/components/PercentCards.tsx
import { useEffect, useMemo, useRef, useState } from "react";
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

function formatPickLabel(
  originalLabel: string | undefined,
  originalUnit: Unit,
  valueInUnit: number,
  unit: Unit,
) {
  const numeric = `${round1(valueInUnit)} ${unit}`;

  // Si hay label, igual mostramos el número real para evitar “label viejo” (ej 20kg bar con 15kg).
  // Si cambian unidades, también mostramos el número en la unidad actual.
  if (originalLabel?.trim()) {
    return originalUnit === unit ? `${originalLabel} (${numeric})` : `${originalLabel} (${numeric})`;
  }

  if (originalUnit !== unit) return numeric;
  return numeric;
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

    // Safari < 14 uses addListener/removeListener
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
    // only needed on mobile (fixed)
    if (!isMobile || !selected) {
      setDetailSpacePx(0);
      return;
    }

    const el = detailRef.current;
    if (!el) return;

    const EXTRA = 12; // breathing room
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
      style={
        {
          display: "grid",
          gap: 12,
          ["--percent-detail-space" as any]: `${detailSpacePx}px`,
        } as React.CSSProperties
      }
    >
      {/* DETAIL (desktop inline; mobile fixed via CSS) */}
      {selected ? (
        <section
          ref={detailRef as any}
          className="percentDetail"
          style={{
            borderRadius: 16,
            padding: 14,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 900 }}>
            {selected.pct}% · {round1(selected.target)}
            {unit}
          </div>

          <div>
            <b>{t.home.bar}:</b>{" "}
            {/* Mostrar SIEMPRE el valor real; el label puede existir pero no manda */}
            {round1(selected.load.bar.valueInUnit)} {unit}
          </div>

          <div>
            <b>{t.home.platesPerSide}:</b>{" "}
            {platesPerSideLabel(selected.load, unit)}
          </div>

          <div>
            <b>{t.home.perSideTotal}:</b> {round1(selected.load.perSide)}
            {unit}
          </div>

          <div style={{ opacity: 0.78 }}>
            {t.home.achieved}: {round1(selected.load.achievedTotal)}
            {unit} (Δ {round1(selected.load.delta)}
            {unit})
          </div>
        </section>
      ) : null}

      {/* GRID */}
      <div className="percentGrid">
        {cards.map(({ pct, target, load }) => {
          const isSelected = pct === selectedPct;
          const is100 = pct === 100;

          return (
            <button
              key={pct}
              type="button"
              className={[
                "percentTile",
                is100 ? "percentTile--max" : "",
                isSelected ? "percentTile--selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => selectPct(pct)}
              aria-pressed={isSelected}
            >
              <div className="percentTileTop">
                <div className="percentPct">
                  {pct}%{" "}
                  {is100 ? <span className="percentPctHint">(MAX)</span> : null}
                </div>

                <div className="percentTarget">
                  {round1(target)}
                  {unit}
                </div>
              </div>

              <div className="percentMeta">
                <b>{t.home.platesPerSide}:</b> {platesPerSideLabel(load, unit)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
