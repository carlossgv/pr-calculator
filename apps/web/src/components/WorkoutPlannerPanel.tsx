import { useEffect, useMemo, useState } from "react";
import type { Unit, UserPreferences } from "@repo/core";
import { prefsForUnit } from "../utils/equipment";
import { planWorkoutLoads } from "../utils/workout-planner";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { PercentCards } from "./PercentCards";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Surface, Sticker, Chip } from "../ui/Surface";
import {
  ArrowDown,
  ArrowUp,
  ListRestart,
  Plus,
  Trash2,
} from "lucide-react";
import styles from "./WorkoutPlannerPanel.module.css";

type PercentOrder = "asc" | "desc";

type Draft = {
  precision: number;
  order: PercentOrder;
  customPcts: number[];
  sequence: number[];
};

type Props = {
  scope?: string;
  baseUnit: Unit;
  baseWeight: number;
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function formatWeight(n: number, unit: Unit) {
  return `${round1(n)} ${unit}`;
}

function formatPlate(plate: { value: number; unit: Unit }) {
  return `${plate.value} ${plate.unit}`;
}

function parsePctInput(s: string): number | null {
  const v = Number(String(s).replace("%", "").trim());
  if (!Number.isFinite(v)) return null;
  if (v <= 0 || v > 300) return null;
  return Math.round(v * 10) / 10;
}

function sanitizePcts(pcts: unknown): number[] {
  if (!Array.isArray(pcts)) return [];
  const out: number[] = [];
  for (const raw of pcts) {
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    const p = Math.round(n * 10) / 10;
    if (p <= 0 || p > 300) continue;
    if (out.some((x) => Math.abs(x - p) < 0.0001)) continue;
    out.push(p);
  }
  return out.sort((a, b) => b - a).slice(0, 12);
}

function sanitizeSequence(pcts: unknown): number[] {
  if (!Array.isArray(pcts)) return [];
  const out: number[] = [];
  for (const raw of pcts) {
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    const p = Math.round(n * 10) / 10;
    if (p <= 0 || p > 300) continue;
    out.push(p);
  }
  return out.slice(0, 16);
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (from === to) return items;
  if (from < 0 || from >= items.length) return items;
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [picked] = next.splice(from, 1);
  next.splice(to, 0, picked);
  return next;
}

function sortRackItems(
  items: {
    plate: { value: number; unit: Unit };
    perSideCount: number;
    totalCount: number;
  }[],
) {
  return [...items].sort((a, b) => {
    if (b.perSideCount !== a.perSideCount) return b.perSideCount - a.perSideCount;
    if (a.plate.unit !== b.plate.unit) return a.plate.unit === "kg" ? -1 : 1;
    return b.plate.value - a.plate.value;
  });
}

export function WorkoutPlannerPanel({ scope = "", baseUnit, baseWeight }: Props) {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    precision: 75,
    order: "desc",
    customPcts: [],
    sequence: [],
  });
  const [customPctText, setCustomPctText] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([repo.getPreferences(), repo.getWorkoutPlannerDraft(scope)])
      .then(([basePrefs, saved]) => {
        if (cancelled) return;
        setPrefs(basePrefs);
        if (saved) {
          setDraft({
            precision: saved.precision,
            order: saved.order,
            customPcts: sanitizePcts(saved.customPcts),
            sequence: sanitizeSequence(saved.sequence),
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [scope]);

  useEffect(() => {
    if (!loaded) return;
    const id = window.setTimeout(() => {
      repo.setWorkoutPlannerDraft(scope, {
        precision: draft.precision,
        order: draft.order,
        customPcts: sanitizePcts(draft.customPcts),
        sequence: sanitizeSequence(draft.sequence),
      });
    }, 200);
    return () => window.clearTimeout(id);
  }, [draft, loaded, scope]);

  const effectivePrefs = useMemo(() => {
    if (!prefs) return null;
    return prefsForUnit(prefs, baseUnit);
  }, [prefs, baseUnit]);

  const plan = useMemo(() => {
    if (!effectivePrefs) return null;
    return planWorkoutLoads({
      maxWeight: baseWeight,
      unit: baseUnit,
      prefs: effectivePrefs,
      percentages: draft.sequence,
      precision: draft.precision,
    });
  }, [draft, effectivePrefs, baseUnit, baseWeight]);

  function addPct(pct: number) {
    setDraft((prev) => ({
      ...prev,
      sequence: [...prev.sequence, pct],
    }));
  }

  function addCustomPct() {
    const pct = parsePctInput(customPctText);
    if (pct == null) return;
    setDraft((prev) => ({
      ...prev,
      sequence: [...prev.sequence, pct],
      customPcts: sanitizePcts([...prev.customPcts, pct]),
    }));
    setCustomPctText("");
  }

  function removeSequenceIndex(index: number) {
    setDraft((prev) => ({
      ...prev,
      sequence: prev.sequence.filter((_, i) => i !== index),
    }));
  }

  function resetPlan() {
    setDraft((prev) => ({
      ...prev,
      sequence: [],
    }));
    setWizardStep(1);
    setShowResetConfirm(false);
  }

  function setOrder(order: PercentOrder) {
    setDraft((prev) => ({ ...prev, order }));
  }

  function goNext() {
    setWizardStep((prev) => Math.min(3, prev + 1) as 1 | 2 | 3);
  }

  function goBack() {
    setWizardStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3);
  }

  if (!loaded || !prefs || !effectivePrefs) return <p>{t.home.loading}</p>;

  const canAddCustom = parsePctInput(customPctText) != null;
  const precisionLabel = `${draft.precision}%`;
  const baseLabel = `${formatWeight(baseWeight, baseUnit)} = 100%`;
  const rackItems = plan ? sortRackItems(plan.rack) : [];

  return (
    <Surface variant="panel" className={styles.panel}>
      <div className={styles.header}>
        <Sticker stamp={<span>{t.workout.stamp}</span>}>
          {t.workout.title}
        </Sticker>

        <Button
          variant="ghost"
          size="sm"
          shape="round"
          iconOnly
          className={styles.resetBtn}
          ariaLabel={t.workout.reset}
          title={t.workout.reset}
          onClick={() => setShowResetConfirm(true)}
        >
          <ListRestart size={16} />
        </Button>
      </div>

      <div className={styles.baseBlock}>
        <div className={styles.baseLabel}>{t.workout.baseWeight}</div>
        <div className={styles.baseValue}>{baseLabel}</div>
        <div className={styles.baseHint}>{t.workout.baseWeightHint}</div>
      </div>

      <div className={styles.wizardNav} role="tablist" aria-label={t.workout.title}>
        <Button
          variant={wizardStep === 1 ? "primary" : "neutral"}
          size="sm"
          shape="pill"
          className={styles.wizardTab}
          onClick={() => setWizardStep(1)}
        >
          {t.workout.selectionStep}
        </Button>
        <Button
          variant={wizardStep === 2 ? "primary" : "neutral"}
          size="sm"
          shape="pill"
          className={styles.wizardTab}
          onClick={() => setWizardStep(2)}
        >
          {t.workout.weightsStep}
        </Button>
        <Button
          variant={wizardStep === 3 ? "primary" : "neutral"}
          size="sm"
          shape="pill"
          className={styles.wizardTab}
          onClick={() => setWizardStep(3)}
        >
          {t.workout.planningStep}
        </Button>
      </div>

      {wizardStep === 1 ? (
        <section className={styles.stepPanel}>
          <div className={styles.sectionTitle}>{t.workout.selectionTitle}</div>

          <div className={styles.stepHint}>{t.workout.sequenceTitle}</div>

          <div className={styles.orderRow}>
            <div className={styles.controlLabel}>{t.home.percentOrderTitle}</div>
            <div className={styles.orderButtons} role="radiogroup" aria-label={t.home.percentOrderTitle}>
              <Button
                variant={draft.order === "desc" ? "primary" : "neutral"}
                size="sm"
                shape="pill"
                onClick={() => setOrder("desc")}
              >
                {t.home.percentOrderDesc}
              </Button>
              <Button
                variant={draft.order === "asc" ? "primary" : "neutral"}
                size="sm"
                shape="pill"
                onClick={() => setOrder("asc")}
              >
                {t.home.percentOrderAsc}
              </Button>
            </div>
          </div>

          <div className={styles.customRow}>
            <input
              className={styles.customInput}
              type="number"
              inputMode="decimal"
              placeholder={t.home.customPercentPlaceholder}
              value={customPctText}
              onChange={(e) => setCustomPctText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustomPct();
              }}
              aria-label={t.home.customPercent}
            />

            <Button
              variant="primary"
              size="md"
              shape="round"
              iconOnly
              disabled={!canAddCustom}
              onClick={addCustomPct}
              ariaLabel={t.home.customPercentAddAria}
              title={t.home.customPercentAdd}
            >
              <Plus size={18} />
            </Button>
          </div>

          {draft.sequence.length ? (
            <div className={styles.sequenceList} aria-label={t.workout.sequenceTitle}>
              {draft.sequence.map((pct, index) => (
                <div key={`${pct}-${index}`} className={styles.sequenceItem}>
                  <div className={styles.sequenceMain}>
                    <div className={styles.sequencePct}>
                      {index + 1}. {pct}%
                    </div>
                    <div className={styles.sequenceLoad}>
                      {t.workout.baseWeight}: {formatWeight((baseWeight * pct) / 100, baseUnit)}
                    </div>
                  </div>

                  <div className={styles.sequenceActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      shape="round"
                      iconOnly
                      disabled={index === 0}
                      ariaLabel={t.workout.moveUp}
                      title={t.workout.moveUp}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          sequence: moveItem(prev.sequence, index, index - 1),
                        }))
                      }
                    >
                      <ArrowUp size={16} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      shape="round"
                      iconOnly
                      disabled={index === draft.sequence.length - 1}
                      ariaLabel={t.workout.moveDown}
                      title={t.workout.moveDown}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          sequence: moveItem(prev.sequence, index, index + 1),
                        }))
                      }
                    >
                      <ArrowDown size={16} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      shape="round"
                      iconOnly
                      ariaLabel={t.workout.removeStep}
                      title={t.workout.removeStep}
                      onClick={() => removeSequenceIndex(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>{t.workout.emptySequence}</div>
          )}

          <PercentCards
            maxWeight={baseWeight}
            unit={baseUnit}
            prefs={effectivePrefs}
            extraPcts={draft.customPcts}
            order={draft.order}
            onPctClick={addPct}
            showDetails={false}
          />

          <div className={styles.stepActionsBar}>
            <Button variant="primary" size="md" onClick={goNext} disabled={!draft.sequence.length}>
              {t.workout.next}
            </Button>
          </div>
        </section>
      ) : null}

      {wizardStep === 2 ? (
        <section className={styles.stepPanel}>
          <div className={styles.sectionTitle}>{t.workout.weightsStep}</div>

          <div className={styles.controlBlock}>
            <div className={styles.controlLabel}>
              {t.workout.accuracy}: {precisionLabel}
            </div>
            <input
              className={styles.slider}
              type="range"
              min={0}
              max={100}
              step={1}
              value={draft.precision}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  precision: Number(e.target.value),
                }))
              }
              aria-label={t.workout.accuracy}
            />
            <div className={styles.sliderHint}>{t.workout.accuracyHint}</div>
          </div>

          <div className={styles.stepHint}>{t.workout.prepHint}</div>

          {rackItems.length ? (
            <div className={styles.rackListPreview}>
              {rackItems.map((item) => (
                <div key={formatPlate(item.plate)} className={styles.rackPreviewItem}>
                  <div className={styles.rackPlate}>{formatPlate(item.plate)}</div>
                  <div className={styles.rackCounts}>
                    {item.perSideCount} / {item.totalCount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>{t.workout.resultsEmpty}</div>
          )}

          <div className={styles.stepActionsBar}>
            <Button variant="neutral" size="md" onClick={goBack}>
              {t.workout.back}
            </Button>
            <Button variant="primary" size="md" onClick={goNext}>
              {t.workout.next}
            </Button>
          </div>
        </section>
      ) : null}

      {wizardStep === 3 ? (
        <section className={styles.stepPanel}>
          <div className={styles.sectionTitle}>{t.workout.planningStep}</div>
          <div className={styles.stepHint}>{t.workout.prepTitle}</div>

          {plan?.steps.length ? (
            <>
              <div className={styles.rackCard}>
                <div className={styles.resultHeader}>
                  <div className={styles.sectionTitle}>{t.workout.rackTitle}</div>
                  <Chip tone="neutral">
                    {plan.totalSwaps} {t.workout.swaps}
                  </Chip>
                </div>

                <div className={styles.rackList}>
                  {rackItems.map((item) => (
                    <div key={formatPlate(item.plate)} className={styles.rackItem}>
                      <div className={styles.rackPlate}>{formatPlate(item.plate)}</div>
                      <div className={styles.rackCounts}>
                        {item.perSideCount} / {item.totalCount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.resultsGrid}>
                <div className={styles.resultsColumn}>
                  {plan.steps.map((step) => (
                    <article
                      key={`${step.index}-${step.pct}`}
                      className={styles.resultCard}
                    >
                      <div className={styles.resultHeader}>
                        <div className={styles.resultPct}>
                          {step.index + 1}. {step.pct}%
                        </div>
                        <Chip tone="neutral">
                          {formatWeight(step.load.achievedTotal, baseUnit)}
                        </Chip>
                      </div>

                      <div className={styles.resultMeta}>
                        <div>
                          {t.workout.target}: {formatWeight(step.target, baseUnit)}
                        </div>
                        <div>
                          {t.workout.delta}: {round1(step.delta)} {baseUnit}
                        </div>
                        <div>
                          {t.workout.plates}: {step.load.platesPerSide.length}
                        </div>
                      </div>

                      <div className={styles.changeBlock}>
                        <div className={styles.changeTitle}>{t.workout.added}</div>
                        <div className={styles.changeText}>
                          {step.added.length
                            ? step.added
                                .map((item) => `${item.count} x ${formatPlate(item.plate)}`)
                                .join(", ")
                            : t.workout.none}
                        </div>
                      </div>

                      <div className={styles.changeBlock}>
                        <div className={styles.changeTitle}>{t.workout.removed}</div>
                        <div className={styles.changeText}>
                          {step.removed.length
                            ? step.removed
                                .map((item) => `${item.count} x ${formatPlate(item.plate)}`)
                                .join(", ")
                            : t.workout.none}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>{t.workout.resultsEmpty}</div>
          )}

          <div className={styles.stepActionsBar}>
            <Button variant="neutral" size="md" onClick={goBack}>
              {t.workout.back}
            </Button>
            <Button variant="primary" size="md" onClick={() => setWizardStep(1)}>
              {t.workout.finish}
            </Button>
          </div>
        </section>
      ) : null}

      {showResetConfirm ? (
        <Modal
          title={t.workout.resetTitle}
          ariaLabel={t.workout.resetTitle}
          onClose={() => setShowResetConfirm(false)}
          closeLabel={t.common.close}
        >
          <div className={styles.resetModal}>
            <div>{t.workout.resetBody}</div>
            <div className={styles.resetActions}>
              <Button
                variant="neutral"
                size="md"
                onClick={() => setShowResetConfirm(false)}
              >
                {t.common.close}
              </Button>
              <Button variant="primary" size="md" onClick={resetPlan}>
                {t.workout.reset}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </Surface>
  );
}
