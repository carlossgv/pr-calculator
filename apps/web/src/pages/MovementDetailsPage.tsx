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
  const [date, setDate] = useState<string>(toDateInputValue(new Date().toISOString()));

  async function reload() {
    setLoading(true);
    const [movements, list] = await Promise.all([repo.listMovements(), repo.listPrEntries(id)]);
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

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <Link to="/movements">{t.movement.back}</Link>
      </div>

      <h2 style={{ margin: 0 }}>
        {t.movement.title}: {movement?.name ?? "(not found)"}
      </h2>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>{t.movement.prs}</h3>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label>
              {t.movement.date}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ display: "block", width: "100%" }}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <label style={{ flex: 1 }}>
              {t.movement.weight}
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                style={{ display: "block", width: "100%" }}
              />
            </label>

            <label style={{ flex: 1 }}>
              {t.movement.reps}
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(Number(e.target.value))}
                style={{ display: "block", width: "100%" }}
              />
            </label>
          </div>

          <button onClick={addEntry}>{t.movement.add}</button>
        </div>

        <div style={{ marginTop: 16 }}>
          {sorted.length === 0 ? (
            <p style={{ margin: 0 }}>{t.movement.empty}</p>
          ) : (
            <ul style={{ paddingLeft: 18 }}>
              {sorted.map((e) => (
                <li key={e.id} style={{ marginBottom: 10 }}>
                  <div>
                    <b>{toDateInputValue(e.date)}</b> — {e.weight} × {e.reps}
                    <button onClick={() => removeEntry(e.id)} style={{ marginLeft: 10 }}>
                      {t.movement.delete}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
