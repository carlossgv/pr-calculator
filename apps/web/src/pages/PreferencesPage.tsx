// apps/web/src/pages/PreferencesPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { Unit, UserPreferences } from "@repo/core";
import { DEFAULT_PREFS, CROSSFIT_LB_WITH_KG_CHANGES } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { Switch } from "../components/Switch";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  applyTheme,
  detectSystemTheme,
  type ResolvedTheme,
} from "../theme/theme";
import { Mars, Venus, ChevronRight } from "lucide-react";
import styles from "./PreferencesPage.module.css";

type BarGender = "male" | "female";

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
  if ((p as any).theme === "system") return detectSystemTheme();
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

  return (
    <div className={styles.page}>
      {/* ✅ Header eliminado: ya existe en AppLayout */}

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
              <div className={styles.rowHint}>
                {t.prefs.theme.current}:{" "}
                <span className={styles.mono}>{resolvedTheme}</span>
              </div>
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
              <span
                aria-hidden="true"
                title={t.prefs.bar.male}
                className={styles.genderPill}
                data-active={!isFemale}
              >
                <Mars size={18} />
              </span>

              <Switch
                checked={isFemale}
                onCheckedChange={(next) => setGender(next ? "female" : "male")}
                ariaLabel={t.prefs.bar.genderToggleAria}
              />

              <span
                aria-hidden="true"
                title={t.prefs.bar.female}
                className={styles.genderPill}
                data-active={isFemale}
              >
                <Venus size={18} />
              </span>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <div className={styles.rowTitle}>{t.prefs.bar.currentTitle}</div>
              <div className={styles.rowHint}>{t.prefs.bar.currentHint}</div>
            </div>

            <div className={styles.rowRight}>
              <span className={styles.valuePill}>
                <span className={styles.mono}>{prefs.bar.value}</span>
                <span className={styles.valueUnit}>{barUnit}</span>
              </span>
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
            onClick={() => applyPreset(DEFAULT_PREFS)}
          >
            <div className={styles.actionLeft}>
              <div className={styles.actionTitle}>
                {t.prefs.presets.olympicKg}
              </div>
              <div className={styles.actionHint}>{olympicHint}</div>
            </div>
            <ChevronRight className={styles.chev} size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            className={styles.actionRow}
            onClick={() => applyPreset(CROSSFIT_LB_WITH_KG_CHANGES)}
          >
            <div className={styles.actionLeft}>
              <div className={styles.actionTitle}>
                {t.prefs.presets.crossfitLb}
              </div>
              <div className={styles.actionHint}>{crossfitHint}</div>
            </div>
            <ChevronRight className={styles.chev} size={18} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
