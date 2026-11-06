import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { convertWeightValue, type Plate, type Unit, type UserPreferences } from "@repo/core";
import { ArrowLeft, Minus, Plus, RotateCcw } from "lucide-react";
import { t, useLanguage } from "../i18n/strings";
import { repo } from "../storage/repo";
import { Button } from "../ui/Button";
import { Surface } from "../ui/Surface";
import { prefsForUnit } from "../utils/equipment";
import {
  displayedLoadedBarTotal,
  plateKey,
  type CountedPlate,
} from "../utils/loaded-bar";
import styles from "./LoadedBarVerificationPage.module.css";
import { plateColors } from "../utils/plate-colors";

function plateLabel(plate: Plate) {
  return `${plate.value} ${plate.unit}`;
}

type VerifierSession = {
  unit: Unit;
  bar: Plate;
  counted: CountedPlate[];
};

let activeSession: VerifierSession | null = null;
const emptyCount: CountedPlate[] = [];
const initialBar: Plate = { value: 20, unit: "kg" };

function MiniPlateDiagram({ counted }: { counted: CountedPlate[] }) {
  const plates = counted
    .flatMap(({ plate, count }) => Array.from({ length: count }, () => plate))
    .sort((a, b) =>
      convertWeightValue(b.value, b.unit, "kg") - convertWeightValue(a.value, a.unit, "kg"),
    );
  const maxLb = Math.max(0, ...plates.filter((plate) => plate.unit === "lb").map((plate) => plate.value));
  const step = Math.min(9, 76 / Math.max(plates.length, 1));

  return (
    <div className={styles.miniDiagram} aria-hidden="true">
      <svg viewBox="0 0 120 70" focusable="false">
        <rect className={styles.miniShaft} x="2" y="32" width="116" height="6" rx="3" />
        <rect className={styles.miniSleeve} x="26" y="27" width="92" height="16" rx="3" />
        {plates.map((plate, index) => {
          const weightKg = convertWeightValue(plate.value, plate.unit, "kg");
          const height = 20 + Math.min(34, Math.sqrt(weightKg / 25) * 34);
          return (
            <rect
              key={`${plateKey(plate)}-${index}`}
              x={37 + index * step}
              y={(70 - height) / 2}
              width={Math.max(1, step - 1)}
              height={height}
              rx="1.5"
              fill={plateColors(plate, maxLb).color}
              className={styles.miniPlate}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function LoadedBarVerificationPage() {
  useLanguage();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [session, setSession] = useState<VerifierSession | null>(() => activeSession);
  const unit = session?.unit ?? "kg";
  const bar = session?.bar ?? initialBar;
  const counted = session?.counted ?? emptyCount;

  useEffect(() => {
    let cancelled = false;
    repo.getPreferences().then((nextPrefs) => {
      if (cancelled) return;
      setPrefs(nextPrefs);
      activeSession ??= {
        unit: nextPrefs.defaultUnit,
        bar: prefsForUnit(nextPrefs, nextPrefs.defaultUnit).bar,
        counted: [],
      };
      setSession(activeSession);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateSession(change: (current: VerifierSession) => VerifierSession) {
    if (!activeSession) return;
    activeSession = change(activeSession);
    setSession(activeSession);
  }

  const choices = useMemo(() => {
    if (!prefs) return [];
    const plates = [...prefsForUnit(prefs, unit).plates, ...counted.map((item) => item.plate)];
    return plates.filter((plate, index) =>
      plates.findIndex((candidate) => plateKey(candidate) === plateKey(plate)) === index,
    );
  }, [counted, prefs, unit]);
  const bars = useMemo(
    () => (unit === "kg" ? [20, 15] : [45, 35]).map((value) => ({ value, unit })),
    [unit],
  );
  const total = useMemo(
    () => displayedLoadedBarTotal(bar, counted, unit),
    [bar, counted, unit],
  );

  function addPlate(plate: Plate) {
    updateSession((current) => {
      const key = plateKey(plate);
      const existing = current.counted.find((item) => plateKey(item.plate) === key);
      if (existing) {
        return {
          ...current,
          counted: current.counted.map((item) =>
            plateKey(item.plate) === key ? { ...item, count: item.count + 1 } : item,
          ),
        };
      }
      return { ...current, counted: [...current.counted, { plate, count: 1 }] };
    });
  }

  function removePlate(plate: Plate) {
    updateSession((current) => ({
      ...current,
      counted: current.counted
        .map((item) =>
          plateKey(item.plate) === plateKey(plate)
            ? { ...item, count: item.count - 1 }
            : item,
        )
        .filter((item) => item.count > 0),
    }));
  }

  function switchUnit(nextUnit: Unit) {
    if (!prefs || nextUnit === unit) return;
    updateSession((current) => ({
      ...current,
      unit: nextUnit,
      bar: prefsForUnit({ ...prefs, bar: current.bar }, nextUnit).bar,
    }));
  }

  if (!prefs || !session) return <p>{t.home.loading}</p>;

  const breakdown = counted.length
    ? `${plateLabel(bar)} + 2 × (${counted
        .map(({ plate, count }) => `${count > 1 ? `${count} × ` : ""}${plateLabel(plate)}`)
        .join(" + ")})`
    : plateLabel(bar);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Button
          variant="neutral"
          shape="round"
          iconOnly
          ariaLabel={t.verifier.back}
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={18} />
        </Button>
        <h1>{t.verifier.title}</h1>
      </header>

      <div className={styles.resultFrame}>
        <Surface variant="panel" className={styles.result} aria-label={t.verifier.total}>
          <div className={styles.resultLabel}>{t.verifier.total}</div>
          <div className={styles.total} aria-live="polite" aria-atomic="true">
            {total} <span>{unit}</span>
          </div>
          <div className={styles.breakdown}>{breakdown}</div>
          {counted.length === 0 ? <div className={styles.barOnly}>{t.verifier.barOnly}</div> : null}
        </Surface>
      </div>

      <div className={styles.equipmentRow}>
        <section className={styles.controls} aria-label={t.verifier.equipment}>
          <div className={styles.controlGroup}>
            <div className={styles.controlLabel}>{t.verifier.unit}</div>
            <div className={styles.choiceRow}>
              {(["kg", "lb"] as const).map((choice) => (
                <Button
                  key={choice}
                  variant={unit === choice ? "primary" : "outline"}
                  size="md"
                  shape="pill"
                  aria-pressed={unit === choice}
                  onClick={() => switchUnit(choice)}
                >
                  {choice}
                </Button>
              ))}
            </div>
          </div>

          <div className={styles.controlGroup}>
            <div className={styles.controlLabel}>{t.verifier.bar}</div>
            <div className={styles.choiceRow}>
              {bars.map((choice) => (
                <Button
                  key={plateKey(choice)}
                  variant={plateKey(bar) === plateKey(choice) ? "primary" : "outline"}
                  size="md"
                  shape="pill"
                  aria-pressed={plateKey(bar) === plateKey(choice)}
                  onClick={() => updateSession((current) => ({ ...current, bar: choice }))}
                >
                  {plateLabel(choice)}
                </Button>
              ))}
            </div>
          </div>
        </section>
        <MiniPlateDiagram counted={counted} />
      </div>

      <section className={styles.platesSection} aria-labelledby="verifier-plates-title">
        <div className={styles.sectionHeading}>
          <h2 id="verifier-plates-title">{t.verifier.platesPerSide}</h2>
          <Button
            variant="ghost"
            size="sm"
            shape="pill"
            disabled={counted.length === 0}
            onClick={() => updateSession((current) => ({ ...current, counted: [] }))}
          >
            <RotateCcw size={15} aria-hidden="true" />
            {t.verifier.clear}
          </Button>
        </div>
        <p className={styles.symmetryHint}>{t.verifier.symmetryHint}</p>
        <div className={styles.plateGrid}>
          {choices.map((plate) => {
            const count = counted.find((item) => plateKey(item.plate) === plateKey(plate))?.count ?? 0;
            return (
              <div className={styles.plateCard} key={plateKey(plate)} role="group" aria-label={plateLabel(plate)}>
                <strong className={styles.plateLabel}>{plateLabel(plate)}</strong>
                <div className={styles.stepper}>
                  <Button
                    variant="outline"
                    size="md"
                    shape="round"
                    iconOnly
                    disabled={count === 0}
                    ariaLabel={t.verifier.removePlate.replace("{plate}", plateLabel(plate))}
                    onClick={() => removePlate(plate)}
                  >
                    <Minus size={18} />
                  </Button>
                  <span className={styles.plateCount} aria-label={t.verifier.count.replace("{count}", String(count))}>
                    {count}
                  </span>
                  <Button
                    variant="outline"
                    size="md"
                    shape="round"
                    iconOnly
                    ariaLabel={t.verifier.addPlate.replace("{plate}", plateLabel(plate))}
                    onClick={() => addPlate(plate)}
                  >
                    <Plus size={18} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
