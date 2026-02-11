/* FILE: apps/web/src/pages/PreferencesPage.tsx */

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Plate,
  Unit,
  UnitContext,
  UserPreferences,
  Weight,
  Language,
} from "@repo/core";
import { DEFAULT_PREFS, CROSSFIT_LB_WITH_KG_CHANGES } from "@repo/core";
import { repo } from "../storage/repo";
import { setLanguage, t } from "../i18n/strings";
import { applyTheme, type ResolvedTheme } from "../theme/theme";
import { Mars, Venus, ChevronRight, Check, Sun, Moon } from "lucide-react";
import styles from "./PreferencesPage.module.css";
import { downloadJson, exportBackup, importBackup } from "../storage/backup";
import { getOrCreateIdentity } from "../sync/identity";
import { Button } from "../ui/Button";

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

function resolveAccentColor(value: unknown, fallback?: string): string {
  if (typeof value === "string" && value.trim().length) return value;
  return fallback ?? "#2563eb";
}

function ensurePrefs(
  p: Partial<UserPreferences> & { defaultUnit?: Unit; bar?: any },
  fallback: UserPreferences,
): UserPreferences {
  const unit: Unit = p.defaultUnit ?? fallback.defaultUnit;

  // ✅ NEW: language safe default
  const lang: Language =
    (p as any).language === "es" || (p as any).language === "en"
      ? (p as any).language
      : (fallback as any).language === "es" ||
          (fallback as any).language === "en"
        ? (fallback as any).language
        : "en";

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

    // ✅ NEW
    language: lang,
    accentColor: resolveAccentColor(
      (p as UserPreferences).accentColor,
      fallback.accentColor,
    ),

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

function buildMailto(opts: { email: string; subject: string; body: string }) {
  const qs = new URLSearchParams({
    subject: opts.subject,
    body: opts.body,
  });
  return `mailto:${opts.email}?${qs.toString()}`;
}

export function PreferencesPage() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [barGender, setBarGender] = useState<BarGender>("male");

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [backupErr, setBackupErr] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState<"export" | "import" | null>(
    null,
  );
  const [supportId, setSupportId] = useState<string>("…");

  useEffect(() => {
    repo.getPreferences().then((p) => {
      const safe = ensurePrefs(p, p);
      setLanguage(safe.language);
      setPrefs(safe);
      setBarGender(inferGenderFromPrefs(safe));
      repo.setPreferences(safe);
    });
  }, []);

  useEffect(() => {
    getOrCreateIdentity()
      .then((id) => setSupportId(id.deviceId || t.prefs.support.unknownId))
      .catch(() => setSupportId(t.prefs.support.unknownId));
  }, []);

  async function doExport() {
    try {
      setBackupErr(null);
      setBackupBusy("export");
      const b = await exportBackup();
      const stamp = b.exportedAt.slice(0, 10);
      downloadJson(`pr-calc-backup-${stamp}.json`, b);
    } catch (e) {
      console.error(e);
      setBackupErr(t.prefs.backup.exportError);
    } finally {
      setBackupBusy(null);
    }
  }

  async function onPickImportFile(file: File) {
    try {
      setBackupErr(null);
      setBackupBusy("import");

      const text = await file.text();
      const parsed = JSON.parse(text);
      await importBackup(parsed);

      // recargar prefs en pantalla (y aplicar theme)
      const nextPrefs = await repo.getPreferences();
      setPrefs(nextPrefs);
      applyTheme(resolvePrefsTheme(nextPrefs), nextPrefs.accentColor);
    } catch (e) {
      console.error(e);
      setBackupErr(t.prefs.backup.importError);
    } finally {
      setBackupBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function doImportClick() {
    fileRef.current?.click();
  }

  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    if (!prefs) return "light";
    return resolvePrefsTheme(prefs);
  }, [prefs]);

  const accentColor = useMemo<string>(() => {
    if (!prefs) return "#2563eb";
    return resolveAccentColor(prefs.accentColor);
  }, [prefs]);

  const barUnit = useMemo<Unit>(() => {
    return prefs?.defaultUnit ?? "kg";
  }, [prefs?.defaultUnit]);

  const selectedPreset = useMemo<PresetKey>(() => {
    if (!prefs) return null;
    return inferSelectedPreset(prefs);
  }, [prefs]);

  // ✅ Contact (i18n)
  const contactName = t.prefs.contact.name;
  const contactEmail = t.prefs.contact.email;

  const mailtoHref = useMemo(() => {
    const sid =
      supportId && supportId !== "…" && supportId !== t.prefs.support.unknownId
        ? supportId
        : t.prefs.support.unknownId;

    const body = t.prefs.contact.body
      .replace("{name}", contactName)
      .replace("{supportId}", sid);

    return buildMailto({
      email: contactEmail,
      subject: t.prefs.contact.subject,
      body,
    });
  }, [supportId, contactName, contactEmail]);

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
    applyTheme(nextTheme, next.accentColor);
  }

  async function setAccentColor(nextColor: string) {
    if (!prefs) return;
    if (prefs.accentColor === nextColor) return;
    const next = ensurePrefs({ ...prefs, accentColor: nextColor }, prefs);
    setPrefs(next);
    await repo.setPreferences(next);
    applyTheme(resolvePrefsTheme(next), next.accentColor);
  }

  async function applyPreset(preset: UserPreferences) {
    if (!prefs) return;

    const prevUnit = prefs.defaultUnit;
    const unit: Unit = preset.defaultUnit;
    const v = barValueFor(unit, barGender);

    const next = ensurePrefs(
      {
        ...preset,
        theme: prefs.theme,
        accentColor: prefs.accentColor,
        language: prefs.language,
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

    setPrefs(next);
    await repo.setPreferences(next);

    if (prevUnit !== next.defaultUnit) {
      await repo.convertPrEntriesUnit(prevUnit, next.defaultUnit);
    }
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

  const olympicHint = t.prefs.presets.olympicHint
    .replace("{bar}", String(barValueFor("kg", barGender)))
    .replace("{unit}", "kg")
    .replace("{unit}", "kg");

  const crossfitHint = t.prefs.presets.crossfitHint
    .replace("{bar}", String(barValueFor("lb", barGender)))
    .replace("{unit}", "lb")
    .replace("{unit}", "lb");

  const olympicActive = selectedPreset === "olympicKg";
  const crossfitActive = selectedPreset === "crossfitLb";

  const supportIdShort =
    supportId === t.prefs.support.unknownId
      ? t.prefs.support.unknownId
      : supportId.slice(0, 8);

  return (
    <div className={styles.page}>
      {/* UI */}
      <section className={styles.section} aria-label={t.prefs.ui.title}>
        <div className={styles.sectionTitle}>{t.prefs.ui.title}</div>

        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <div className={styles.rowTitle}>{t.prefs.language.title}</div>
            </div>

            <div className={`${styles.rowRight} ${styles.rowRightWrap}`}>
              <div
                className={styles.seg}
                role="radiogroup"
                aria-label={t.prefs.language.aria}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  shape="pill"
                  className={styles.segBtn}
                  data-active={prefs.language === "en"}
                  role="radio"
                  aria-checked={prefs.language === "en"}
                  ariaLabel="English"
                  onClick={() => {
                    if (prefs.language === "en") return;
                    const next: Language = "en";
                    setLanguage(next);
                    save({ ...prefs, language: next });
                  }}
                >
                  EN
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  shape="pill"
                  className={styles.segBtn}
                  data-active={prefs.language === "es"}
                  role="radio"
                  aria-checked={prefs.language === "es"}
                  ariaLabel="Español"
                  onClick={() => {
                    if (prefs.language === "es") return;
                    const next: Language = "es";
                    setLanguage(next);
                    save({ ...prefs, language: next });
                  }}
                >
                  ES
                </Button>
              </div>
            </div>
          </div>

          <div className={`${styles.row} ${styles.rowDivider}`}>
            <div className={styles.rowLeft}>
              <div className={styles.rowTitle}>{t.prefs.theme.title}</div>
              <span className={styles.srOnly}>
                {t.prefs.theme.current}: {resolvedTheme}
              </span>
            </div>

            <div className={styles.rowRight}>
              <div
                className={styles.themeSegIcons}
                role="radiogroup"
                aria-label={t.prefs.theme.toggleRowAria}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  shape="round"
                  iconOnly
                  className={styles.themeIconBtn}
                  data-active={resolvedTheme === "light"}
                  role="radio"
                  aria-checked={resolvedTheme === "light"}
                  aria-label={t.prefs.theme.lightTitle}
                  onClick={() => {
                    if (resolvedTheme === "light") return;
                    toggleTheme();
                  }}
                >
                  <Sun size={18} />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  shape="round"
                  iconOnly
                  className={styles.themeIconBtn}
                  data-active={resolvedTheme === "dark"}
                  role="radio"
                  aria-checked={resolvedTheme === "dark"}
                  aria-label={t.prefs.theme.darkTitle}
                  onClick={() => {
                    if (resolvedTheme === "dark") return;
                    toggleTheme();
                  }}
                >
                  <Moon size={18} />
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <div className={styles.rowTitle}>{t.prefs.theme.primaryTitle}</div>
              <div className={styles.rowHint}>{t.prefs.theme.primaryHint}</div>
            </div>

            <div className={`${styles.rowRight} ${styles.rowRightWrap}`}>
              <label className={styles.colorInputWrap}>
                <input
                  type="color"
                  className={styles.colorInput}
                  value={accentColor}
                  aria-label={t.prefs.theme.primaryTitle}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
                <span className={styles.colorValue}>{accentColor}</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* PRESETS */}
      <section className={styles.section} aria-label={t.prefs.presets.title}>
        <div className={styles.sectionTitle}>{t.prefs.presets.title}</div>

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
                  <Button
                    size="sm"
                    variant="ghost"
                    shape="round"
                    iconOnly
                    className={styles.genderIconBtn}
                    data-active={!isFemale}
                    role="radio"
                    aria-checked={!isFemale}
                    aria-label={t.prefs.bar.male}
                    onClick={() => setGender("male")}
                  >
                    <Mars size={20} />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    shape="round"
                    iconOnly
                    className={styles.genderIconBtn}
                    data-active={isFemale}
                    role="radio"
                    aria-checked={isFemale}
                    aria-label={t.prefs.bar.female}
                    onClick={() => setGender("female")}
                  >
                    <Venus size={20} />
                  </Button>
                </div>

                <span
                  className={styles.valuePill}
                  aria-label={t.prefs.bar.currentHint}
                >
                  <span className={styles.mono}>{prefs.bar.value}</span>
                  <span className={styles.valueUnit}>{barUnit}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <Button
            variant="row"
            className={styles.actionRow}
            data-active={olympicActive}
            aria-pressed={olympicActive}
            onClick={() => applyPreset(DEFAULT_PREFS)}
          >
            <div className={styles.actionLeft}>
              <div className={styles.actionTitle}>
                {t.prefs.presets.olympicKg}
              </div>
              <div className={styles.actionHint}>{olympicHint}</div>
            </div>

            <div className={styles.actionRight}>
              {olympicActive ? (
                <span
                  className={styles.selectedPill}
                  aria-hidden="true"
                  title={t.prefs.presets.selectedTitle}
                >
                  <Check size={16} />
                </span>
              ) : null}
              <ChevronRight
                className={styles.chev}
                size={18}
                aria-hidden="true"
              />
            </div>
          </Button>

          <Button
            variant="row"
            className={styles.actionRow}
            data-active={crossfitActive}
            aria-pressed={crossfitActive}
            onClick={() => applyPreset(CROSSFIT_LB_WITH_KG_CHANGES)}
          >
            <div className={styles.actionLeft}>
              <div className={styles.actionTitle}>
                {t.prefs.presets.crossfitLb}
              </div>
              <div className={styles.actionHint}>{crossfitHint}</div>
            </div>

            <div className={styles.actionRight}>
              {crossfitActive ? (
                <span
                  className={styles.selectedPill}
                  aria-hidden="true"
                  title={t.prefs.presets.selectedTitle}
                >
                  <Check size={16} />
                </span>
              ) : null}
              <ChevronRight
                className={styles.chev}
                size={18}
                aria-hidden="true"
              />
            </div>
          </Button>
        </div>
      </section>

      {/* BACKUP (manual) */}
      <section className={styles.section} aria-label={t.prefs.backup.title}>
        <div className={styles.sectionTitle}>{t.prefs.backup.title}</div>

        <div className={styles.card}>
          <Button
            variant="row"
            className={styles.actionRow}
            onClick={doExport}
            disabled={backupBusy !== null}
            aria-label={t.prefs.backup.exportAria}
          >
            <div className={styles.actionLeft}>
              <div className={styles.actionTitle}>
                {t.prefs.backup.exportTitle}
              </div>
              <div className={styles.actionHint}>
                {t.prefs.backup.exportHint}
              </div>
            </div>
            <div className={styles.actionRight}>
              <ChevronRight
                className={styles.chev}
                size={18}
                aria-hidden="true"
              />
            </div>
          </Button>

          <Button
            variant="row"
            className={styles.actionRow}
            onClick={doImportClick}
            disabled={backupBusy !== null}
            aria-label={t.prefs.backup.importAria}
          >
            <div className={styles.actionLeft}>
              <div className={styles.actionTitle}>
                {t.prefs.backup.importTitle}
              </div>
              <div className={styles.actionHint}>
                {t.prefs.backup.importHint}
              </div>
            </div>
            <div className={styles.actionRight}>
              <ChevronRight
                className={styles.chev}
                size={18}
                aria-hidden="true"
              />
            </div>
          </Button>

          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickImportFile(f);
            }}
          />

          {backupErr ? (
            <div className={styles.rowHint} style={{ padding: "10px 14px" }}>
              {backupErr}
            </div>
          ) : null}
        </div>
      </section>

      {/* SUPPORT */}
      <section className={styles.section} aria-label={t.prefs.support.title}>
        <div className={styles.sectionTitle}>{t.prefs.support.title}</div>

        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <div className={styles.rowTitle}>{t.prefs.support.idTitle}</div>
            </div>

            <div className={styles.rowRight}>
              <Button
                size="sm"
                variant="outline"
                shape="pill"
                className={styles.supportId}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(supportId);
                  } catch {}
                }}
                title={t.prefs.support.copyFullTitle}
                aria-label={t.prefs.support.copyAria}
              >
                <span className={styles.supportIdMono}>{supportIdShort}</span>
                <span className={styles.supportIdDots}>…</span>
              </Button>
            </div>
          </div>

          <Button
            variant="row"
            className={styles.actionRow}
            aria-label={t.prefs.contact.aria}
            onClick={() => {
              // iOS Safari: window.location suele ser más confiable para mailto
              window.location.href = mailtoHref;
            }}
          >
            <div className={styles.actionLeft}>
              <div className={styles.actionTitle}>{contactName}</div>
              <div className={styles.actionHint}>
                <span className={styles.mono}>{contactEmail}</span>
              </div>
            </div>

            <div className={styles.actionRight}>
              <ChevronRight
                className={styles.chev}
                size={18}
                aria-hidden="true"
              />
            </div>
          </Button>
        </div>
      </section>

      {/* SUPPORT PR CALC */}
      <section className={styles.section} aria-label={t.prefs.donate.title}>
        <div className={styles.sectionTitle}>{t.prefs.donate.title}</div>

        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <div className={styles.rowTitle}>
                {t.prefs.donate.donateTitle}
              </div>
              <div className={styles.rowHint}>{t.prefs.donate.donateHint}</div>
            </div>

            <div className={styles.rowRight}>
              <a
                className={styles.kofiLink}
                href="https://ko-fi.com/carlossgv"
                target="_blank"
                rel="noreferrer noopener"
                aria-label={t.prefs.donate.donateAria}
              >
                <img
                  className={styles.kofiImage}
                  src="https://storage.ko-fi.com/cdn/kofi5.png?v=6"
                  alt={t.prefs.donate.donateAlt}
                  height={36}
                />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
