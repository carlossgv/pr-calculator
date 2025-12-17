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
import { Mars, Venus } from "lucide-react";
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

function resolvePrefsTheme(p: UserPreferences): ResolvedTheme {
  // back-compat si existe data vieja con "system"
  if ((p as any).theme === "system") return detectSystemTheme();
  return p.theme === "dark" ? "dark" : "light";
}

export function PreferencesPage() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [barGender, setBarGender] = useState<BarGender>("male");

  useEffect(() => {
    repo.getPreferences().then((p) => {
      setPrefs(p);
      setBarGender(inferGenderFromPrefs(p));
    });
  }, []);

  const barUnit = useMemo<Unit>(() => {
    return prefs?.defaultUnit ?? "kg";
  }, [prefs?.defaultUnit]);

  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    if (!prefs) return "light";
    return resolvePrefsTheme(prefs);
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

    const next: UserPreferences = { ...prefs, theme: nextTheme };
    setPrefs(next);
    await repo.setPreferences(next);
    applyTheme(nextTheme);
  }

  function applyPreset(preset: UserPreferences) {
    const unit: Unit = preset.defaultUnit;

    const next: UserPreferences = {
      ...preset,
      defaultUnit: unit,
      bar: {
        ...preset.bar,
        unit,
        value: barValueFor(unit, barGender),
      },
      // Mantener theme actual al aplicar presets (si prefieres que el preset lo cambie, lo sacamos)
      theme: prefs.theme,
    };

    save(next);
  }

  function setGender(nextGender: BarGender) {
    if (!prefs) return;

    setBarGender(nextGender);

    const next: UserPreferences = {
      ...prefs,
      bar: {
        ...prefs.bar,
        unit: barUnit,
        value: barValueFor(barUnit, nextGender),
      },
    };

    save(next);
  }

  const isFemale = barGender === "female";

  return (
    <div className={styles.page}>
      {/* THEME */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t.prefs.theme.title}</div>

        <div className={styles.card}>
          <button
            type="button"
            className={styles.rowButton}
            onClick={toggleTheme}
            aria-label={t.prefs.theme.toggleRowAria}
          >
            <div className={styles.rowLabel}>
              <div className={styles.rowTitle}>{t.prefs.theme.title}</div>
              <div className={styles.rowHint}>
                {t.prefs.theme.current}:{" "}
                <span className={styles.mono}>{resolvedTheme}</span>
              </div>
            </div>

            <div
              className={styles.rowControl}
              onClick={(e) => e.stopPropagation()}
            >
              <ThemeToggle value={resolvedTheme} onToggle={toggleTheme} />
            </div>
          </button>
        </div>
      </section>

      {/* BAR */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          {t.prefs.bar.title} ({barUnit.toUpperCase()})
        </div>

        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <div className={styles.rowTitle}>{t.prefs.bar.genderTitle}</div>
              <div className={styles.rowHint}>{t.prefs.bar.genderHint}</div>
            </div>

            <div className={styles.rowControl}>
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
            <div className={styles.rowLabel}>
              <div className={styles.rowTitle}>{t.prefs.bar.currentTitle}</div>
              <div className={styles.rowHint}>{t.prefs.bar.currentHint}</div>
            </div>

            <div className={styles.rowControl}>
              <span className={styles.valuePill}>
                <span className={styles.mono}>
                  {barValueFor(barUnit, barGender)}
                </span>
                <span className={styles.valueUnit}>{barUnit}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PLATE PRESETS */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>{t.prefs.presets.title}</div>

        <div className={styles.card}>
          <button
            type="button"
            className={styles.actionRow}
            onClick={() => applyPreset(DEFAULT_PREFS)}
          >
            <div className={styles.actionTitle}>
              {t.prefs.presets.olympicKg}
            </div>
            <div className={styles.actionChevron} aria-hidden="true">
              →
            </div>
          </button>

          <button
            type="button"
            className={styles.actionRow}
            onClick={() => applyPreset(CROSSFIT_LB_WITH_KG_CHANGES)}
          >
            <div className={styles.actionTitle}>
              {t.prefs.presets.crossfitLb}
            </div>
            <div className={styles.actionChevron} aria-hidden="true">
              →
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
