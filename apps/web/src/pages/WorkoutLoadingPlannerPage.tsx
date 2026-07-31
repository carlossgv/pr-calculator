import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { Movement, PlatePick, Unit, UserPreferences } from "@repo/core";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Plus, Trash2 } from "lucide-react";
import { PlateLoadDetails } from "../components/PercentCards";
import { t } from "../i18n/strings";
import { repo } from "../storage/repo";
import { Button } from "../ui/Button";
import { Surface } from "../ui/Surface";
import { Modal } from "../ui/Modal";
import { prefsForUnit } from "../utils/equipment";
import {
  addPlannerPercentage,
  buildPlannerRows,
  derivePlateTransition,
  deriveSequentialInventory,
  movePlannerPercentage,
  type PlateQuantity,
  type PlannerRow,
} from "../utils/workout-loading-planner";
import styles from "./WorkoutLoadingPlannerPage.module.css";

export function parsePlannerRouteParams(unitParam?: string, weightParam?: string) {
  const unit: Unit = unitParam === "lb" ? "lb" : "kg";
  const parsedWeight = Number(String(weightParam ?? "").replace(",", "."));
  const weight = Number.isFinite(parsedWeight) && parsedWeight >= 0 ? parsedWeight : 100;
  return { unit, weight };
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function formatWeight(value: number, unit: Unit) {
  return `${round1(value)} ${unit}`;
}

function formatPick(pick: PlatePick, unit: Unit) {
  const native = `${pick.plate.value} ${pick.plate.unit}`;
  return pick.plate.unit === unit
    ? native
    : `${native} (${formatWeight(pick.valueInUnit, unit)})`;
}

function groupPicks(picks: PlatePick[]): PlateQuantity[] {
  const grouped = new Map<string, PlateQuantity>();
  for (const pick of picks) {
    const key = `${pick.plate.unit}:${pick.plate.value}`;
    const current = grouped.get(key);
    if (current) current.count += 1;
    else grouped.set(key, { key, pick, count: 1 });
  }
  return [...grouped.values()].sort((a, b) => b.pick.valueInUnit - a.pick.valueInUnit);
}

function formatQuantities(items: PlateQuantity[], unit: Unit) {
  return items
    .map((item) => `${item.count > 1 ? `${item.count} × ` : ""}${formatPick(item.pick, unit)}`)
    .join(" + ");
}

function safeReturnPath(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function WorkoutLoadingPlannerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unit: unitParam, weight: weightParam } = useParams<{
    unit: string;
    weight: string;
  }>();
  const { unit, weight } = useMemo(
    () => parsePlannerRouteParams(unitParam, weightParam),
    [unitParam, weightParam],
  );
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const movementId = query.get("movementId");
  const returnTo = safeReturnPath(query.get("returnTo"));
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [movement, setMovement] = useState<Movement | null>(null);
  const [percentages, setPercentages] = useState<number[]>([]);
  const [percentageInput, setPercentageInput] = useState("");
  const [inputError, setInputError] = useState(false);
  const [diagramRow, setDiagramRow] = useState<PlannerRow | null>(null);

  useEffect(() => {
    Promise.all([
      repo.getPreferences(),
      movementId ? repo.getMovement(movementId) : Promise.resolve(null),
    ]).then(([nextPrefs, nextMovement]) => {
      setPrefs(nextPrefs);
      setMovement(nextMovement);
    });
  }, [movementId]);

  const effectivePrefs = useMemo(
    () => (prefs ? prefsForUnit(prefs, unit) : null),
    [prefs, unit],
  );
  const rows = useMemo(
    () => (effectivePrefs ? buildPlannerRows(weight, percentages, unit, effectivePrefs) : []),
    [effectivePrefs, percentages, unit, weight],
  );
  const inventory = useMemo(() => deriveSequentialInventory(rows), [rows]);

  function goBack() {
    if (returnTo) navigate(returnTo);
    else if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }

  function addPercentage() {
    const next = addPlannerPercentage(percentages, percentageInput);
    if (!next) {
      setInputError(true);
      return;
    }
    setPercentages(next);
    setPercentageInput("");
    setInputError(false);
  }

  if (!effectivePrefs) return <p>{t.home.loading}</p>;

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <Button
          variant="neutral"
          size="md"
          shape="round"
          iconOnly
          ariaLabel={t.planner.back}
          title={t.planner.back}
          onClick={goBack}
        >
          <ArrowLeft size={18} />
        </Button>
        <div className={styles.heading}>
          <h1>{t.planner.title}</h1>
          {movement ? <div className={styles.movementName}>{movement.name}</div> : null}
        </div>
      </header>

      <Surface variant="panel" className={styles.baseWeight}>
        <span>{t.planner.baseWeight}</span>
        <strong>{formatWeight(weight, unit)}</strong>
      </Surface>

      <section className={styles.percentSection} aria-labelledby="planner-percentages">
        <div className={styles.sectionHeading}>
          <h2 id="planner-percentages">{t.planner.percentages}</h2>
          <span>{t.planner.orderHint}</span>
        </div>

        <form
          className={styles.addForm}
          onSubmit={(event) => {
            event.preventDefault();
            addPercentage();
          }}
        >
          <label className={styles.srOnly} htmlFor="planner-percentage">
            {t.planner.percentageInput}
          </label>
          <input
            id="planner-percentage"
            type="text"
            inputMode="decimal"
            placeholder={t.planner.percentagePlaceholder}
            value={percentageInput}
            aria-invalid={inputError}
            aria-describedby={inputError ? "planner-percentage-error" : undefined}
            onChange={(event) => {
              setPercentageInput(event.target.value);
              setInputError(false);
            }}
          />
          <Button
            variant="primary"
            size="md"
            shape="round"
            iconOnly
            ariaLabel={t.planner.addPercentage}
            title={t.planner.addPercentage}
            type="submit"
          >
            <Plus size={18} />
          </Button>
        </form>
        {inputError ? (
          <div id="planner-percentage-error" className={styles.inputError} role="alert">
            {t.planner.invalidPercentage}
          </div>
        ) : null}
      </section>

      {rows.length ? (
        <section className={styles.plan} aria-label={t.planner.planResults}>
          {rows.map((row, index) => {
            const transition = rows[index + 1]
              ? derivePlateTransition(row.load.platesPerSide, rows[index + 1].load.platesPerSide)
              : null;
            const plateConfiguration = groupPicks(row.load.platesPerSide);
            return (
              <div className={styles.planItem} key={row.percentage}>
                <Surface variant="card" className={styles.resultCard}>
                  <div className={styles.resultTop}>
                    <div className={styles.percentage}>{row.percentage}%</div>
                    <div className={styles.targetBlock}>
                      <span>{t.planner.target}</span>
                      <strong>{formatWeight(row.targetWeight, unit)}</strong>
                    </div>
                    <div className={styles.orderActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        shape="round"
                        iconOnly
                        disabled={index === 0}
                        ariaLabel={`${t.planner.moveUp} ${row.percentage}%`}
                        title={t.planner.moveUp}
                        onClick={() => setPercentages(movePlannerPercentage(percentages, index, -1))}
                      >
                        <ArrowUp size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        shape="round"
                        iconOnly
                        disabled={index === rows.length - 1}
                        ariaLabel={`${t.planner.moveDown} ${row.percentage}%`}
                        title={t.planner.moveDown}
                        onClick={() => setPercentages(movePlannerPercentage(percentages, index, 1))}
                      >
                        <ArrowDown size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        shape="round"
                        iconOnly
                        ariaLabel={`${t.planner.removePercentage} ${row.percentage}%`}
                        title={t.planner.removePercentage}
                        onClick={() => setPercentages(percentages.filter((_, itemIndex) => itemIndex !== index))}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>

                  {Math.abs(row.signedDelta) > 0.0001 ? (
                    <div className={styles.achieved}>
                      <span>{t.planner.loadable}</span>
                      <strong>{formatWeight(row.achievedWeight, unit)}</strong>
                      <span className={styles.delta}>
                        ({row.signedDelta > 0 ? "+" : ""}{formatWeight(row.signedDelta, unit)})
                      </span>
                    </div>
                  ) : null}

                  <div className={styles.plateRow}>
                    <div className={styles.plates}>
                      <span>{t.planner.platesPerSide}</span>
                      <strong>
                        {plateConfiguration.length
                          ? formatQuantities(plateConfiguration, unit)
                          : t.planner.barOnly}
                      </strong>
                    </div>
                    <Button
                      variant="outline"
                      size="md"
                      shape="round"
                      iconOnly
                      className={styles.diagramButton}
                      ariaLabel={`${t.planner.showDiagram} ${row.percentage}%`}
                      title={t.planner.showDiagram}
                      onClick={() => setDiagramRow(row)}
                    >
                      <Eye size={18} />
                    </Button>
                  </div>
                </Surface>

                {transition ? (
                  <div className={styles.transition}>
                    {transition.unchanged ? (
                      <span>{t.planner.noChange}</span>
                    ) : (
                      <>
                        {transition.remove.length ? (
                          <span>
                            <b>{t.planner.remove}:</b> {formatQuantities(transition.remove, unit)}
                          </span>
                        ) : null}
                        {transition.add.length ? (
                          <span>
                            <b>{t.planner.add}:</b> {formatQuantities(transition.add, unit)}
                          </span>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>
      ) : (
        <Surface variant="flat" className={styles.emptyState}>
          {t.planner.emptyPlan}
        </Surface>
      )}

      {inventory.length ? (
        <details className={styles.inventory}>
          <summary>{t.planner.inventoryTitle}</summary>
          <div className={styles.inventoryBody}>
            <p>{t.planner.inventoryHint}</p>
            <ul>
              {inventory.map((item) => (
                <li key={item.key}>
                  <strong>{item.count} ×</strong> {formatPick(item.pick, unit)}
                </li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}

      {diagramRow ? (
        <Modal
          title={`${diagramRow.percentage}% · ${formatWeight(
            diagramRow.achievedWeight,
            unit,
          )}`}
          ariaLabel={t.planner.diagramTitle}
          closeLabel={t.common.close}
          onClose={() => setDiagramRow(null)}
        >
          <PlateLoadDetails load={diagramRow.load} unit={unit} />
        </Modal>
      ) : null}
    </main>
  );
}
