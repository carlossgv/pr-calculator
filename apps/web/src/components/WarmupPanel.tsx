// FILE: apps/web/src/components/WarmupPanel.tsx
import { useMemo, useState } from "react";
import type { Unit, UserPreferences } from "@repo/core";
import { calculateLoad } from "@repo/core";
import { t } from "../i18n/strings";
import styles from "./WarmupPanel.module.css";
import { prefsForUnit } from "../utils/equipment";
import { WARMUP_TEMPLATES, type WarmupTemplateId } from "../utils/warmup";
import { ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";

type Props = {
  unit: Unit;
  prefs: UserPreferences;

  /** Uses the HERO (100%) input from calculator. */
  targetWeight: number;

  onPickWeight: (weight: number) => void;
};

type Row = {
  id: string;
  pct: number;
  reps: string;
  raw: number;
  achieved: number;
  delta: number;
  breakdown: string;
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function WarmupPanel(props: Props) {
  const { unit, prefs: basePrefs, targetWeight, onPickWeight } = props;

  const [templateId, setTemplateId] = useState<WarmupTemplateId>("crossfit");

  const effectivePrefs = useMemo(
    () => prefsForUnit(basePrefs, unit),
    [basePrefs, unit],
  );

  const rows = useMemo<Row[]>(() => {
    const tpl =
      WARMUP_TEMPLATES.find((x) => x.id === templateId) ??
      WARMUP_TEMPLATES[0];

    const safeTarget = Number.isFinite(targetWeight)
      ? Math.max(0, targetWeight)
      : 0;

    return tpl.steps.map((s, idx) => {
      const raw = round1((safeTarget * s.pct) / 100);

      const load = calculateLoad(raw, unit, effectivePrefs);
      const achieved = round1(load.achievedTotal);
      const delta = round1(achieved - raw);

      return {
        id: `${tpl.id}-${idx}-${s.pct}`,
        pct: s.pct,
        reps: s.reps,
        raw,
        achieved,
        delta,
        breakdown: formatBreakdown(load),
      };
    });
  }, [templateId, targetWeight, unit, effectivePrefs]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>{t.warmup.title}</div>
        <div className={styles.sub}>{t.warmup.subtitle}</div>
      </div>

      {/* NEW: segmented pill selector (en vez de <select> pequeño) */}
      <div className={styles.templateRow} aria-label={t.warmup.template}>
        {WARMUP_TEMPLATES.map((tpl) => {
          const active = tpl.id === templateId;
          return (
            <Button
              key={tpl.id}
              variant={active ? "primary" : "neutral"}
              size="sm"
              shape="pill"
              className={styles.templateBtn}
              onClick={() => setTemplateId(tpl.id)}
              ariaLabel={t.warmup.templates[tpl.id]}
              title={t.warmup.templates[tpl.id]}
            >
              {t.warmup.templates[tpl.id]}
            </Button>
          );
        })}
      </div>

      <div className={styles.list}>
        {rows.map((r) => {
          const showDelta =
            Number.isFinite(r.delta) && Math.abs(r.delta) >= 0.05;

          return (
            <button
              key={r.id}
              className={styles.row}
              onClick={() => onPickWeight(r.achieved)}
              type="button"
            >
              <div className={styles.left}>
                <div className={styles.line1}>
                  <span className={styles.pct}>{r.pct}%</span>
                  <span className={styles.dot}>•</span>
                  <span className={styles.reps}>
                    {t.warmup.reps.replace("{reps}", r.reps)}
                  </span>
                </div>

                <div className={styles.line2}>
                  <span className={styles.weight}>
                    {r.achieved} {unit}
                  </span>

                  {showDelta ? (
                    <span className={styles.hint}>
                      {t.warmup.roundedFrom.replace("{w}", String(r.raw))}
                      <span className={styles.delta}>
                        {" "}
                        {t.warmup.deltaLabel} {r.delta > 0 ? "+" : ""}
                        {r.delta}
                      </span>
                    </span>
                  ) : null}
                </div>

                <div className={styles.breakdown}>
                  <span className={styles.breakdownLabel}>
                    {t.warmup.platesPerSide}
                  </span>{" "}
                  <span className={styles.breakdownText}>{r.breakdown}</span>
                </div>
              </div>

              <div className={styles.right}>
                <ChevronRight size={18} className={styles.chev} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatBreakdown(load: ReturnType<typeof calculateLoad>) {
  const counts = new Map<string, { label: string; sort: number; count: number }>();

  for (const pick of load.platesPerSide) {
    const p = pick.plate;
    const key = `${p.value}|${p.unit}`;
    const label = p.label ?? `${p.value} ${p.unit}`;
    const prev = counts.get(key);
    if (prev) prev.count += 1;
    else counts.set(key, { label, sort: pick.valueInUnit, count: 1 });
  }

  const items = Array.from(counts.values()).sort((a, b) => b.sort - a.sort);
  if (items.length === 0) return "—";

  return items.map((x) => `${x.count}×${x.label}`).join(" + ");
}
