/* apps/web/src/pages/MovementsPage.tsx */
import { useEffect, useMemo, useState } from "react";
import type { Movement, PrEntry, UserPreferences } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { useNavigate } from "react-router-dom";

function uid() {
  // ✅ iOS/Safari fallback (randomUUID can be missing or restricted)
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }

  // Fallback: UUID v4-ish using getRandomValues when possible
  try {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // RFC4122-ish
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch {
    // last resort
    return `m_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

type Best = { entry: PrEntry | null; by: "weight" };

function pickBestByWeight(entries: PrEntry[]): Best {
  if (entries.length === 0) return { entry: null, by: "weight" };
  let best = entries[0];
  for (const e of entries) if (e.weight > best.weight) best = e;
  return { entry: best, by: "weight" };
}

function toDateLabel(iso: string) {
  return iso.slice(0, 10);
}

export function MovementsPage() {
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [items, setItems] = useState<Movement[]>([]);
  const [bestMap, setBestMap] = useState<Record<string, Best>>({});
  const [name, setName] = useState("");

  async function reload() {
    const [p, movements] = await Promise.all([
      repo.getPreferences(),
      repo.listMovements(),
    ]);

    setPrefs(p);
    setItems(movements);

    const pairs = await Promise.all(
      movements.map(async (m) => {
        const entries = await repo.listPrEntries(m.id);
        return [m.id, pickBestByWeight(entries)] as const;
      }),
    );

    const next: Record<string, Best> = {};
    for (const [id, best] of pairs) next[id] = best;
    setBestMap(next);
  }

  useEffect(() => {
    reload();
  }, []);

  async function add() {
    try {
      const trimmed = name.trim();
      if (!trimmed) return;

      await repo.upsertMovement({
        id: uid(),
        name: trimmed,
        createdAt: new Date().toISOString(),
      });

      setName("");
      await reload();
    } catch (err) {
      console.error("Failed to add movement:", err);
    }
  }

  async function remove(id: string) {
    await repo.deleteMovement(id);
    await reload();
  }

  function goCalc(movementId: string) {
    const unit = prefs?.defaultUnit ?? "kg";
    const best = bestMap[movementId]?.entry;
    const weight = best?.weight ?? 100;
    navigate(`/movements/${movementId}/calc/${unit}/${weight}`);
  }

  function goManage(movementId: string) {
    navigate(`/movements/${movementId}/manage`);
  }

  const cards = useMemo(() => {
    return items.map((m) => {
      const best = bestMap[m.id]?.entry ?? null;
      return { m, best };
    });
  }, [items, bestMap]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 12,
          display: "grid",
          gap: 10,
          background: "var(--card-bg)",
        }}
      >
        <div style={{ fontWeight: 900 }}>Movements</div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder={t.movements.placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button onClick={add} style={{ fontWeight: 800 }}>
            {t.movements.add}
          </button>
        </div>
      </section>

      <div style={{ display: "grid", gap: 10 }}>
        {cards.map(({ m, best }) => (
          <div
            key={m.id}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 12,
              background: "var(--card-bg)",
              display: "grid",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 950,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.name}
                </div>

                {best ? (
                  <div style={{ fontSize: 12, opacity: 0.78 }}>
                    {toDateLabel(best.date)} · <b>{best.weight}</b> × {best.reps}{" "}
                    <span style={{ opacity: 0.75 }}>{prefs?.defaultUnit ?? ""}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    No PR yet — tap Manage to add one
                  </div>
                )}
              </div>

              <button
                onClick={() => remove(m.id)}
                style={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  padding: "8px 10px",
                  opacity: 0.9,
                }}
              >
                {t.movements.delete}
              </button>
            </div>

            <button
              onClick={() => goCalc(m.id)}
              style={{
                width: "100%",
                borderRadius: 14,
                border: "1px solid var(--border)",
                padding: "12px 14px",
                fontWeight: 900,
                background:
                  "color-mix(in oklab, var(--accent) 10%, var(--card-bg))",
              }}
            >
              Open calculator
            </button>

            <button
              onClick={() => goManage(m.id)}
              style={{
                width: "100%",
                borderRadius: 14,
                border: "1px solid var(--border)",
                padding: "10px 12px",
                fontWeight: 800,
              }}
            >
              Manage PRs
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
