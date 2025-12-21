// FILE: apps/web/src/pages/MovementDetailsPage.tsx
import { ArrowLeft, Calculator, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Movement, PrEntry, Unit, UserPreferences } from "@repo/core";
import { convertWeightValue } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { UnitPill } from "../components/UnitPill";
import { NumberInput } from "../components/NumberInput";
import { Chip, Sticker, Surface, SurfaceHeader } from "../ui/Surface";
import styles from "./MovementDetailsPage.module.css";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

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

type ConfirmState =
  | { kind: "deleteEntry"; entry: PrEntry }
  | { kind: "deleteMovement" }
  | null;

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

  // confirm modal
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

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
    return [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [entries]);

  function normalizeToDefaultUnit(input: { value: number; unit: Unit }): number {
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

      if (!weight) return setError(t.movement.errors.invalidWeight);
      if (!reps) return setError(t.movement.errors.invalidReps);
      if (!date?.trim()) return setError(t.movement.errors.invalidDate);

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
      setError(t.movement.errors.saveFailed);
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
      if (!w) return setError(t.movement.errors.invalidWeight);
      if (!r) return setError(t.movement.errors.invalidReps);

      const original = entries.find((x) => x.id === entryId);
      if (!original) return;

      if (!editDate?.trim()) return setError(t.movement.errors.invalidDate);

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
      setError(t.movement.errors.updateFailed);
    }
  }

  function requestDeleteEntry(e: PrEntry) {
    setError(null);
    setConfirm({ kind: "deleteEntry", entry: e });
  }

  function requestDeleteMovement() {
    setError(null);
    setConfirm({ kind: "deleteMovement" });
  }

  async function confirmDelete() {
    if (!confirm) return;

    try {
      setConfirmBusy(true);

      if (confirm.kind === "deleteEntry") {
        await repo.deletePrEntry(confirm.entry.id);
        setConfirm(null);
        await reload();
        return;
      }

      if (confirm.kind === "deleteMovement") {
        if (!movement) return;
        await repo.deleteMovement(movement.id);
        setConfirm(null);
        navigate("/movements");
        return;
      }
    } finally {
      setConfirmBusy(false);
    }
  }

  function goCalc(targetWeight: number) {
    const unit: Unit = (prefs?.defaultUnit ?? "kg") as Unit;
    navigate(`/movements/${id}/calc/${unit}/${targetWeight}`);
  }

  function goBack() {
    navigate(-1);
  }

  if (loading) return <p>{t.movement.loading}</p>;

  const unit = prefs?.defaultUnit ?? "kg";

  const confirmTitle =
    confirm?.kind === "deleteMovement"
      ? t.movement.confirm.deleteMovementTitle
      : t.movement.confirm.deleteEntryTitle;

  const confirmBody =
    confirm?.kind === "deleteMovement"
      ? t.movement.confirm.deleteMovementBody.replace(
          "{name}",
          movement?.name ?? t.movement.title,
        )
      : confirm?.kind === "deleteEntry"
        ? t.movement.confirm.deleteEntryBody
            .replace("{date}", toDateInputValue(confirm.entry.date))
            .replace("{weight}", String(confirm.entry.weight))
            .replace("{reps}", String(confirm.entry.reps))
        : "";

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Button
          variant="neutral"
          size="md"
          shape="round"
          iconOnly
          className={styles.iconBtnMd}
          ariaLabel={t.movement.back}
          title={t.movement.back}
          onClick={goBack}
        >
          <ArrowLeft size={18} />
        </Button>

        <div className={styles.topActions}>
          <Button
            variant="neutral"
            size="md"
            shape="round"
            iconOnly
            className={styles.iconBtnMd}
            ariaLabel={t.movements.openCalculator}
            title={t.movements.openCalculator}
            onClick={() => navigate(`/movements/${id}/calc/${unit}/100`)}
          >
            <Calculator size={18} />
          </Button>

          <Button
            variant="danger"
            size="md"
            shape="round"
            iconOnly
            className={styles.iconBtnMd}
            ariaLabel={t.movement.delete}
            title={t.movement.delete}
            onClick={requestDeleteMovement}
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      <h2 className={styles.title}>{movement?.name ?? t.movement.title}</h2>

      <Surface variant="panel" aria-label={t.movement.prs}>
        <SurfaceHeader
          leftLabel={<Sticker stamp={<span>MANAGE</span>}>PR CALC</Sticker>}
          rightChip={<Chip tone="accent3">{unit}</Chip>}
          showBarcode
        />

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

          <Button
            variant="primary"
            size="lg"
            shape="pill"
            fullWidth
            onClick={addEntry}
          >
            {t.movement.add}
          </Button>
        </div>

        <div className={styles.divider}>
          <div className={styles.dividerTitle}>{t.movement.prsTitle}</div>
          <div className={styles.count}>{sorted.length}</div>
        </div>

        <div className={styles.list}>
          {sorted.length === 0 ? (
            <div className={styles.empty}>{t.movement.empty}</div>
          ) : (
            sorted.map((e) => {
              const isEditing = editingEntryId === e.id;

              return (
                <Surface key={e.id} variant="card" className={styles.item}>
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
                        <Button
                          variant="primary"
                          size="md"
                          shape="pill"
                          onClick={saveEditEntry}
                        >
                          {t.movement.save}
                        </Button>

                        <Button
                          variant="ghost"
                          size="md"
                          shape="pill"
                          onClick={() => setEditingEntryId(null)}
                        >
                          {t.movement.cancel}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className={styles.itemRow}>
                      <div className={styles.itemMeta}>
                        <b>{toDateInputValue(e.date)}</b>
                        <span className={styles.itemMetaText}>
                          {e.weight} × {e.reps}{" "}
                          <span className={styles.unitHint}>{unit}</span>
                        </span>
                      </div>

                      <div className={styles.actions}>
                        <Button
                          variant="neutral"
                          size="md"
                          shape="round"
                          iconOnly
                          className={styles.iconBtnMd}
                          ariaLabel={t.movements.openCalculator}
                          title={t.movements.openCalculator}
                          onClick={() => goCalc(e.weight)}
                        >
                          <Calculator size={18} />
                        </Button>

                        <Button
                          variant="neutral"
                          size="md"
                          shape="round"
                          iconOnly
                          className={styles.iconBtnMd}
                          ariaLabel={t.movement.editAria}
                          title={t.movement.editAria}
                          onClick={() => startEditEntry(e)}
                        >
                          <Pencil size={18} />
                        </Button>

                        <Button
                          variant="danger"
                          size="md"
                          shape="round"
                          iconOnly
                          className={styles.iconBtnMd}
                          ariaLabel={t.movement.deleteAria}
                          title={t.movement.deleteAria}
                          onClick={() => requestDeleteEntry(e)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  )}
                </Surface>
              );
            })
          )}
        </div>
      </Surface>

      {confirm ? (
        <Modal
          title={confirmTitle}
          ariaLabel={confirmTitle}
          onClose={() => (confirmBusy ? null : setConfirm(null))}
        >
          <div className={styles.confirmBody}>{confirmBody}</div>

          <div className={styles.modalActions}>
            <Button
              variant="danger"
              size="lg"
              shape="pill"
              fullWidth
              disabled={confirmBusy}
              onClick={confirmDelete}
            >
              {confirm.kind === "deleteMovement"
                ? t.movement.confirm.deleteMovementCta
                : t.movement.confirm.deleteEntryCta}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              shape="pill"
              fullWidth
              disabled={confirmBusy}
              onClick={() => setConfirm(null)}
            >
              {t.movement.confirm.cancelCta}
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
