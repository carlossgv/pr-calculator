// apps/web/src/pages/MovementDetailsPage.tsx
import { Calculator, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Movement, PrEntry, Unit, UserPreferences } from "@repo/core";
import { convertWeightValue } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { UnitPill } from "../components/UnitPill";
import { NumberInput } from "../components/NumberInput";
import styles from "./MovementDetailsPage.module.css";

function uid() {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }

  try {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch {
    return `m_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

function parsePositiveFloat(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parsePositiveInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

export function MovementDetailsPage() {
  const navigate = useNavigate();
  const { movementId } = useParams<{ movementId: string }>();
  const id = movementId ?? "";

  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [movement, setMovement] = useState<Movement | null>(null);
  const [entries, setEntries] = useState<PrEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // add form
  const [weightText, setWeightText] = useState("100");
  const [weightUnit, setWeightUnit] = useState<Unit>("kg");
  const [repsText, setRepsText] = useState("1");
  const [date, setDate] = useState<string>(
    toDateInputValue(new Date().toISOString()),
  );

  // edit
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editWeightText, setEditWeightText] = useState("0");
  const [editWeightUnit, setEditWeightUnit] = useState<Unit>("kg");
  const [editRepsText, setEditRepsText] = useState("1");
  const [editDate, setEditDate] = useState<string>(
    toDateInputValue(new Date().toISOString()),
  );

  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);

    const [p, mov, list] = await Promise.all([
      repo.getPreferences(),
      repo.getMovement(id),
      repo.listPrEntries(id),
    ]);

    setPrefs(p);
    setMovement(mov);
    setEntries(list);

    setWeightUnit(p.defaultUnit);
    setEditWeightUnit(p.defaultUnit);

    setLoading(false);
  }

  useEffect(() => {
    if (!id) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sorted = useMemo(() => {
    // repo ya viene ordenado, esto es solo "seguro" por si cambias backend
    return [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [entries]);

  function normalizeToDefaultUnit(input: {
    value: number;
    unit: Unit;
  }): number {
    const def = prefs?.defaultUnit ?? "kg";
    if (input.unit === def) return input.value;
    return round1(convertWeightValue(input.value, input.unit, def));
  }

  async function addEntry() {
    try {
      setError(null);
      if (!id || !prefs) return;

      const weight = parsePositiveFloat(weightText);
      const reps = parsePositiveInt(repsText);

      if (!weight) return setError("Weight inválido");
      if (!reps) return setError("Reps inválidas");
      if (!date?.trim()) return setError("Fecha inválida");

      const isoDate = new Date(date + "T12:00:00.000Z").toISOString();
      const normalizedWeight = normalizeToDefaultUnit({
        value: weight,
        unit: weightUnit,
      });

      const now = new Date().toISOString();

      const entry: PrEntry = {
        id: uid(),
        movementId: id,
        weight: normalizedWeight,
        reps,
        date: isoDate,
        createdAt: now,
        updatedAt: now,
      };

      await repo.addPrEntry(entry);
      await reload();
    } catch (err) {
      console.error("Add PR failed:", err);
      setError("No se pudo guardar el PR");
    }
  }

  function startEditEntry(e: PrEntry) {
    setError(null);
    setEditingEntryId(e.id);
    setEditWeightText(String(e.weight));
    setEditWeightUnit(prefs?.defaultUnit ?? "kg");
    setEditRepsText(String(e.reps));
    setEditDate(toDateInputValue(e.date));
  }

  async function saveEditEntry() {
    try {
      setError(null);

      const entryId = editingEntryId;
      if (!entryId || !prefs) return;

      const w = parsePositiveFloat(editWeightText);
      const r = parsePositiveInt(editRepsText);
      if (!w) return setError("Weight inválido");
      if (!r) return setError("Reps inválidas");

      const original = entries.find((x) => x.id === entryId);
      if (!original) return;

      const isoDate = new Date(editDate + "T12:00:00.000Z").toISOString();
      const normalizedWeight = normalizeToDefaultUnit({
        value: w,
        unit: editWeightUnit,
      });

      const now = new Date().toISOString();

      const next: PrEntry = {
        ...original,
        weight: normalizedWeight,
        reps: r,
        date: isoDate,
        updatedAt: now,
      };

      await repo.upsertPrEntry(next);

      setEditingEntryId(null);
      await reload();
    } catch (err) {
      console.error("Save PR edit failed:", err);
      setError("No se pudo guardar el cambio");
    }
  }

  function goCalc(targetWeight: number) {
    const unit: Unit = (prefs?.defaultUnit ?? "kg") as Unit;
    navigate(`/movements/${id}/calc/${unit}/${targetWeight}`);
  }

  if (loading) return <p>{t.movement.loading}</p>;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link to="/movements">{t.movement.back}</Link>
        <Link
          to={`/movements/${id}/calc/${prefs?.defaultUnit ?? "kg"}/100`}
          className={styles.topLink}
        >
          Calculator
        </Link>
      </div>

      <h2 className={styles.title}>{movement?.name ?? t.movement.title}</h2>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>{t.movement.prs}</h3>

        <div className={styles.form}>
          <label className={styles.label}>
            <span className={styles.labelText}>{t.movement.date}</span>
            <input
              className={styles.dateInput}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label className={styles.label}>
            <span className={styles.labelText}>
              {t.movement.weight} × {t.movement.reps}
            </span>

            <div className={styles.setRow}>
              <div className={styles.field}>
                <NumberInput
                  value={weightText}
                  onChange={setWeightText}
                  inputMode="decimal"
                />
              </div>

              <div className={styles.unitWrap}>
                <UnitPill value={weightUnit} onChange={setWeightUnit} />
              </div>

              <span className={styles.times}>×</span>

              <div className={styles.fieldReps}>
                <NumberInput
                  value={repsText}
                  onChange={setRepsText}
                  inputMode="numeric"
                />
              </div>
            </div>

{prefs ? (
  <div className={styles.hint}>
    {t.movement.savedIn} {prefs.defaultUnit}
  </div>
) : null}
          </label>

          {error ? <div className={styles.error}>{error}</div> : null}

          <button
            type="button"
            onClick={addEntry}
            className={styles.primaryBtn}
          >
            {t.movement.add}
          </button>
        </div>

        <div className={styles.divider}>
          <div className={styles.dividerTitle}>PRs</div>
          <div className={styles.count}>{sorted.length}</div>
        </div>

        <div className={styles.list}>
          {sorted.map((e) => {
            const isEditing = editingEntryId === e.id;

            return (
              <div key={e.id} className={styles.item}>
                {isEditing ? (
                  <>
                    <input
                      className={styles.dateInput}
                      type="date"
                      value={editDate}
                      onChange={(ev) => setEditDate(ev.target.value)}
                    />

                    <div className={styles.editGrid}>
                      <label className={styles.label}>
                        <span className={styles.labelText}>
                          {t.movement.weight}
                        </span>
                        <div className={styles.row}>
                          <div className={styles.grow}>
                            <NumberInput
                              value={editWeightText}
                              onChange={setEditWeightText}
                              inputMode="decimal"
                            />
                          </div>
                          <div className={styles.unitWrap}>
                            <UnitPill
                              value={editWeightUnit}
                              onChange={setEditWeightUnit}
                            />
                          </div>
                        </div>
                      </label>

                      <label className={styles.label}>
                        <span className={styles.labelText}>
                          {t.movement.reps}
                        </span>
                        <NumberInput
                          value={editRepsText}
                          onChange={setEditRepsText}
                          inputMode="numeric"
                        />
                      </label>
                    </div>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        onClick={saveEditEntry}
                        className={`${styles.actionBtn} ${styles.actionBtnStrong}`}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingEntryId(null)}
                        className={styles.actionBtn}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={styles.itemRow}>
                    <div className={styles.itemMeta}>
                      <b>{toDateInputValue(e.date)}</b>
                      <span className={styles.itemMetaText}>
                        {e.weight} × {e.reps}{" "}
                        <span className={styles.unitHint}>
                          {prefs?.defaultUnit}
                        </span>
                      </span>
                    </div>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        onClick={() => goCalc(e.weight)}
                        className={styles.iconBtn}
                        aria-label="Calculator"
                        title="Calculator"
                      >
                        <Calculator size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditEntry(e)}
                        className={styles.iconBtn}
                        aria-label="Edit"
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => repo.deletePrEntry(e.id).then(reload)}
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        aria-label="Delete"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
