// FILE: apps/web/src/pages/PreferencesPage.tsx
import { useEffect, useMemo, useState } from "react";
import type {
  Plate,
  Unit,
  UnitContext,
  UserPreferences,
  Weight,
} from "@repo/core";
import { DEFAULT_PREFS, CROSSFIT_LB_WITH_KG_CHANGES } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { ThemeToggle } from "../components/ThemeToggle";
import { applyTheme, type ResolvedTheme } from "../theme/theme";
import { Mars, Venus, ChevronRight, Check } from "lucide-react";
import styles from "./PreferencesPage.module.css";

type BarGender = "male" | "female";
type PresetKey = "olympicKg" | "crossfitLb" | null;

function inferGenderFromPrefs(p: UserPreferences): BarGender {
  const unit = p.defaultUnit;
  const v = p.bar?.value ?? 0;

  if (unit === "lb") return v === 35 ? "female" : "male";
  return v === 15 ? "female" : "male";
}

function barValueFor(unit: Unit, gender: BarGender): number {
  if (unit === "lb") return gender === "male" ? 45 : 35;
  return gender === "male" ? 20 : 15;
}

function barLabelFor(unit: Unit, gender: BarGender): string {
  const v = barValueFor(unit, gender);
  return `${v} ${unit} bar`;
}

function resolvePrefsTheme(p: UserPreferences): ResolvedTheme {
  return p.theme === "dark" ? "dark" : "light";
}

function ensurePrefs(
  p: Partial<UserPreferences> & { defaultUnit?: Unit; bar?: any },
  fallback: UserPreferences,
): UserPreferences {
  const unit: Unit = p.defaultUnit ?? fallback.defaultUnit;

  const barValue =
    typeof p.bar?.value === "number"
      ? p.bar.value
      : typeof fallback.bar?.value === "number"
        ? fallback.bar.value
        : barValueFor(unit, "male");

  const nextGender: BarGender =
    unit === "lb"
      ? barValue === 35
        ? "female"
        : "male"
      : barValue === 15
        ? "female"
        : "male";

  return {
    ...(fallback as UserPreferences),
    ...(p as UserPreferences),
    defaultUnit: unit,
    bar: {
      ...(fallback.bar ?? {}),
      ...(p.bar ?? {}),
      unit,
      value: barValue,
      label: barLabelFor(unit, nextGender),
    },
  };
}

function onRowKeyDown(e: React.KeyboardEvent, onActivate: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    onActivate();
  }
}

function eqWeight(a: Weight, b: Weight) {
  return a.unit === b.unit && a.value === b.value;
}

function eqPlates(a: Plate[], b: Plate[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].unit !== b[i].unit) return false;
    if (a[i].value !== b[i].value) return false;
  }
  return true;
}

function eqContexts(
  a: Record<Unit, UnitContext>,
  b: Record<Unit, UnitContext>,
) {
  return a.kg === b.kg && a.lb === b.lb;
}

function inferSelectedPreset(p: UserPreferences): PresetKey {
  // para “preset seleccionado” ignoramos theme y bar (bar cambia por gender)
  const isOlympic =
    p.defaultUnit === DEFAULT_PREFS.defaultUnit &&
    eqContexts(p.contexts, DEFAULT_PREFS.contexts) &&
    eqWeight(p.rounding, DEFAULT_PREFS.rounding) &&
    eqPlates(p.plates, DEFAULT_PREFS.plates);

  if (isOlympic) return "olympicKg";

  const isCrossfit =
    p.defaultUnit === CROSSFIT_LB_WITH_KG_CHANGES.defaultUnit &&
    eqContexts(p.contexts, CROSSFIT_LB_WITH_KG_CHANGES.contexts) &&
    eqWeight(p.rounding, CROSSFIT_LB_WITH_KG_CHANGES.rounding) &&
    eqPlates(p.plates, CROSSFIT_LB_WITH_KG_CHANGES.plates);

  if (isCrossfit) return "crossfitLb";

  return null;
}

export function PreferencesPage() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [barGender, setBarGender] = useState<BarGender>("male");

  useEffect(() => {
    repo.getPreferences().then((p) => {
      const safe = ensurePrefs(p, p);
      setPrefs(safe);
      setBarGender(inferGenderFromPrefs(safe));
      repo.setPreferences(safe);
    });
  }, []);

  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    if (!prefs) return "light";
    return resolvePrefsTheme(prefs);
  }, [prefs]);

  const barUnit = useMemo<Unit>(() => {
    return prefs?.defaultUnit ?? "kg";
  }, [prefs?.defaultUnit]);

  const selectedPreset = useMemo<PresetKey>(() => {
    if (!prefs) return null;
    return inferSelectedPreset(prefs);
  }, [prefs]);

  if (!prefs) return <p>{t.home.loading}</p>;

  function save(next: UserPreferences) {
    setPrefs(next);
    repo.setPreferences(next);
  }

  async function toggleTheme() {
    if (!prefs) return;

    const current = resolvePrefsTheme(prefs);
    const nextTheme: ResolvedTheme = current === "dark" ? "light" : "dark";

    const next = ensurePrefs({ ...prefs, theme: nextTheme }, prefs);

    setPrefs(next);
    await repo.setPreferences(next);
    applyTheme(nextTheme);
  }

  function applyPreset(preset: UserPreferences) {
    if (!prefs) return;

    const unit: Unit = preset.defaultUnit;
    const v = barValueFor(unit, barGender);

    const next = ensurePrefs(
      {
        ...preset,
        theme: prefs.theme,
        defaultUnit: unit,
        bar: {
          ...preset.bar,
          unit,
          value: v,
          label: barLabelFor(unit, barGender),
        },
      },
      prefs,
    );

    save(next);
  }

  function setGender(nextGender: BarGender) {
    if (!prefs) return;

    setBarGender(nextGender);

    const v = barValueFor(barUnit, nextGender);

    const next = ensurePrefs(
      {
        ...prefs,
        bar: {
          ...prefs.bar,
          unit: barUnit,
          value: v,
          label: barLabelFor(barUnit, nextGender),
        },
      },
      prefs,
    );

    save(next);
  }

  const isFemale = barGender === "female";
  const olympicHint = `${barValueFor("kg", barGender)}kg bar, kg plates`;
  const crossfitHint = `${barValueFor("lb", barGender)}lb bar, lb plates + kg change`;

  const olympicActive = selectedPreset === "olympicKg";
  const crossfitActive = selectedPreset === "crossfitLb";

  return (
    <div className={styles.page}>
      {/* THEME */}
      <section className={styles.section} aria-label={t.prefs.theme.title}>
        <div className={styles.sectionTitle}>{t.prefs.theme.title}</div>

        <div className={styles.card}>
          <div
            className={styles.rowPressable}
            role="button"
            tabIndex={0}
            onClick={toggleTheme}
            onKeyDown={(e) => onRowKeyDown(e, toggleTheme)}
            aria-label={t.prefs.theme.toggleRowAria}
          >
            <div className={styles.rowLeft}>
              <div className={styles.rowTitle}>{t.prefs.theme.title}</div>
              {/* Minimal: no “Current: dark”. Lo dejamos accesible igual */}
              <span className={styles.srOnly}>
                {t.prefs.theme.current}: {resolvedTheme}
              </span>
            </div>

            <div className={styles.rowRight}>
              <span
                className={styles.iconWrap}
                onClick={(e) => e.stopPropagation()}
              >
                <ThemeToggle value={resolvedTheme} onToggle={toggleTheme} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BAR */}
      <section className={styles.section} aria-label={t.prefs.bar.title}>
        <div className={styles.sectionTitle}>
          {t.prefs.bar.title} ({barUnit.toUpperCase()})
        </div>

        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <div className={styles.rowTitle}>{t.prefs.bar.genderTitle}</div>
              <div className={styles.rowHint}>{t.prefs.bar.genderHint}</div>
            </div>

            <div className={styles.rowRight}>
              <div className={styles.barControl}>
                <div
                  className={styles.genderSegIcons}
                  role="radiogroup"
                  aria-label={t.prefs.bar.genderToggleAria}
                >
                  <button
                    type="button"
                    className={styles.genderIconBtn}
                    data-active={!isFemale}
                    role="radio"
                    aria-checked={!isFemale}
                    aria-label={t.prefs.bar.male}
                    onClick={() => setGender("male")}
                  >
                    <Mars size={20} />
                  </button>

                  <button
                    type="button"
                    className={styles.genderIconBtn}
                    data-active={isFemale}
                    role="radio"
                    aria-checked={isFemale}
                    aria-label={t.prefs.bar.female}
                    onClick={() => setGender("female")}
                  >
                    <Venus size={20} />
                  </button>
                </div>

                {/* ✅ Peso único acá (sin duplicar “Current”) */}
                <span className={styles.valuePill} aria-label={t.prefs.bar.currentHint}>
                  <span className={styles.mono}>{prefs.bar.value}</span>
                  <span className={styles.valueUnit}>{barUnit}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRESETS */}
      <section className={styles.section} aria-label={t.prefs.presets.title}>
        <div className={styles.sectionTitle}>{t.prefs.presets.title}</div>

        <div className={styles.card}>
          <button
            type="button"
            className={styles.actionRow}
            data-active={olympicActive}
            aria-pressed={olympicActive}
            onClick={() => applyPreset(DEFAULT_PREFS)}
          >
            <div className={styles.actionLeft}>
              <div className={styles.actionTitle}>{t.prefs.presets.olympicKg}</div>
              <div className={styles.actionHint}>{olympicHint}</div>
            </div>

            <div className={styles.actionRight}>
              {olympicActive ? (
                <span className={styles.selectedPill} aria-hidden="true" title="Selected">
                  <Check size={16} />
                </span>
              ) : null}
              <ChevronRight className={styles.chev} size={18} aria-hidden="true" />
            </div>
          </button>

          <button
            type="button"
            className={styles.actionRow}
            data-active={crossfitActive}
            aria-pressed={crossfitActive}
            onClick={() => applyPreset(CROSSFIT_LB_WITH_KG_CHANGES)}
          >
            <div className={styles.actionLeft}>
              <div className={styles.actionTitle}>{t.prefs.presets.crossfitLb}</div>
              <div className={styles.actionHint}>{crossfitHint}</div>
            </div>

            <div className={styles.actionRight}>
              {crossfitActive ? (
                <span className={styles.selectedPill} aria-hidden="true" title="Selected">
                  <Check size={16} />
                </span>
              ) : null}
              <ChevronRight className={styles.chev} size={18} aria-hidden="true" />
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
