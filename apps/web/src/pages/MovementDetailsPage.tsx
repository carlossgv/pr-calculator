// apps/web/src/pages/MovementDetailsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Movement, PrEntry } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";

function uid() {
  return crypto.randomUUID();
}

function toDateInputValue(iso: string) {
  // iso -> YYYY-MM-DD
  return iso.slice(0, 10);
}

export function MovementDetailsPage() {
  const { movementId } = useParams<{ movementId: string }>();
  const id = movementId ?? "";

  const [movement, setMovement] = useState<Movement | null>(null);
  const [entries, setEntries] = useState<PrEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [weight, setWeight] = useState<number>(100);
  const [reps, setReps] = useState<number>(1);
  const [date, setDate] = useState<string>(
    toDateInputValue(new Date().toISOString()),
  );

  async function reload() {
    setLoading(true);
    const [movements, list] = await Promise.all([
      repo.listMovements(),
      repo.listPrEntries(id),
    ]);
    setMovement(movements.find((m) => m.id === id) ?? null);
    setEntries(list);
    setLoading(false);
  }

  useEffect(() => {
    if (!id) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sorted = useMemo(() => {
    // repo ya devuelve reverse por date, pero aquí aseguramos.
    return [...entries].sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);

  async function addEntry() {
    if (!id) return;
    if (!Number.isFinite(weight) || weight <= 0) return;
    if (!Number.isFinite(reps) || reps <= 0) return;

    const isoDate = new Date(date + "T12:00:00.000Z").toISOString(); // estable
    const entry: PrEntry = {
      id: uid(),
      movementId: id,
      weight,
      reps,
      date: isoDate,
    };

    await repo.addPrEntry(entry);
    await reload();
  }

  async function removeEntry(entryId: string) {
    await repo.deletePrEntry(entryId);
    await reload();
  }

  if (!id) {
    return (
      <div>
        <p>Missing movementId.</p>
        <Link to="/movements">{t.movement.back}</Link>
      </div>
    );
  }

  if (loading) return <p>{t.movement.loading}</p>;

  // apps/web/src/pages/MovementDetailsPage.tsx
  // (solo muestro el return modificado; el resto igual)

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <Link to="/movements">{t.movement.back}</Link>
      </div>

      <h2 style={{ margin: 0 }}>
        {t.movement.title}: {movement?.name ?? "(not found)"}
      </h2>

      <section
        style={{
          border: "1px solid var(--border, #ddd)",
          borderRadius: 14,
          padding: 12,
          display: "grid",
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>{t.movement.prs}</h3>

        {/* Form */}
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>
              {t.movement.date}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid var(--border, #ddd)",
                fontSize: 16,
              }}
            />
          </label>
          <div className="form-grid-2">
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, opacity: 0.8 }}>
                {t.movement.weight}
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  borderRadius: 12,
                  border: "1px solid var(--border, #ddd)",
                  fontSize: 16,
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, opacity: 0.8 }}>
                {t.movement.reps}
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  borderRadius: 12,
                  border: "1px solid var(--border, #ddd)",
                  fontSize: 16,
                }}
              />
            </label>
          </div>
          <button
            onClick={addEntry}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border, #ddd)",
              fontWeight: 700,
            }}
          >
            {t.movement.add}
          </button>
        </div>

        {/* List */}
        <div style={{ display: "grid", gap: 10 }}>
          {sorted.length === 0 ? (
            <p style={{ margin: 0, opacity: 0.8 }}>{t.movement.empty}</p>
          ) : (
            sorted.map((e) => (
              <div
                key={e.id}
                style={{
                  border: "1px solid var(--border, #ddd)",
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <b>{toDateInputValue(e.date)}</b>
                  <span style={{ opacity: 0.85 }}>
                    {e.weight} × {e.reps}
                  </span>
                </div>

                <button
                  onClick={() => removeEntry(e.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--border, #ddd)",
                  }}
                >
                  {t.movement.delete}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
