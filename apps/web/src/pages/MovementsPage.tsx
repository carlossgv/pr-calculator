// FILE: apps/web/src/pages/MovementsPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { Movement, PrEntry, UserPreferences } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { useNavigate } from "react-router-dom";
import {
  ActionButton,
  Chip,
  IconButton,
  Sticker,
  Surface,
  SurfaceHeader,
} from "../ui/Surface";
import styles from "./MovementsPage.module.css";
import { Trash2 } from "lucide-react";

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
    const trimmed = name.trim();
    if (!trimmed) return;

    await repo.upsertMovement({
      id: uid(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    });

    setName("");
    await reload();
  }

  async function removeMovement(m: Movement) {
    const ok = window.confirm(`Delete "${m.name}"? This will remove its PRs too.`);
    if (!ok) return;
    await repo.deleteMovement(m.id);
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
    return items.map((m) => ({ m, best: bestMap[m.id]?.entry ?? null }));
  }, [items, bestMap]);

  const unit = prefs?.defaultUnit ?? "kg";

  return (
    <div className={styles.page}>
      <Surface variant="panel" aria-label="Movements panel">
        <SurfaceHeader
          leftLabel={<Sticker stamp={<span>LIST</span>}>PR CALC</Sticker>}
          rightChip={<Chip tone="accent3">{unit}</Chip>}
          showBarcode
        />

        <div className={styles.addRow}>
          <input
            className={styles.input}
            placeholder={t.movements.placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <ActionButton
            variant="primary"
            onClick={add}
            ariaLabel={t.movements.add}
            title={t.movements.add}
          >
            {t.movements.add}
          </ActionButton>
        </div>

        <div className={styles.hint}>
          {cards.length === 0 ? (
            <span className={styles.muted}>No movements yet. Add your first one 👇</span>
          ) : (
            <span className={styles.muted}>
              Tap <b>Open calculator</b> to start from your best lift.
            </span>
          )}
        </div>
      </Surface>

      <div className={styles.list}>
        {cards.map(({ m, best }) => (
          <Surface key={m.id} variant="card" className={styles.item}>
            <div className={styles.itemTop}>
              <div className={styles.meta}>
                <div className={styles.name} title={m.name}>
                  {m.name}
                </div>

                {best ? (
                  <div className={styles.sub}>
                    {toDateLabel(best.date)} · <b>{best.weight}</b> × {best.reps}{" "}
                    <span className={styles.unitHint}>{unit}</span>
                  </div>
                ) : (
                  <div className={styles.subMuted}>
                    No PR yet — tap Manage PRs to add one
                  </div>
                )}
              </div>

              <IconButton
                variant="danger"
                ariaLabel={t.movements.delete}
                title={t.movements.delete}
                onClick={() => removeMovement(m)}
              >
                <Trash2 size={18} />
              </IconButton>
            </div>

            <div className={styles.actions}>
              <ActionButton
                variant="primary"
                fullWidth
                onClick={() => goCalc(m.id)}
              >
                Open calculator
              </ActionButton>

              <ActionButton fullWidth onClick={() => goManage(m.id)}>
                Manage PRs
              </ActionButton>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
