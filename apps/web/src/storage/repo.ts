/* FILE: apps/web/src/storage/repo.ts */
import {
  DEFAULT_PREFS,
  type Movement,
  type PrEntry,
  type UserPreferences,
} from "@repo/core";
import Dexie from "dexie";
import { db } from "./db";
import { markDirty } from "./changes";

function isNewPrefsShape(p: unknown): p is UserPreferences {
  const v = p as any;
  return Boolean(
    v &&
      typeof v === "object" &&
      (v.defaultUnit === "kg" || v.defaultUnit === "lb") &&
      v.bar &&
      typeof v.bar.value === "number" &&
      (v.bar.unit === "kg" || v.bar.unit === "lb") &&
      Array.isArray(v.plates),
  );
}

function nowIso() {
  return new Date().toISOString();
}

function isDeleted(row: { deletedAt?: string | null } | null | undefined) {
  return Boolean(row && row.deletedAt);
}

export const repo = {
async getPreferences(): Promise<UserPreferences> {
  const row = await db.preferences.get("prefs");
  const value = (row as any)?.value;

  if (isNewPrefsShape(value)) {
    const contexts = value.contexts ?? { kg: "olympic", lb: "crossfit" };
    const theme = value.theme ?? "dark";

    // ✅ NEW: backfill language
    const language = value.language === "es" || value.language === "en"
      ? value.language
      : "en";

    if (!value.contexts || !value.theme || !value.language) {
      const next: UserPreferences = { ...value, contexts, theme, language };
      await db.preferences.put({ id: "prefs", value: next });
      markDirty();
      return next;
    }

    return value;
  }

  await db.preferences.put({ id: "prefs", value: DEFAULT_PREFS });
  markDirty();
  return DEFAULT_PREFS;
},

  async setPreferences(prefs: UserPreferences): Promise<void> {
    await db.preferences.put({ id: "prefs", value: prefs });
    markDirty();
  },

  async listMovements(): Promise<Movement[]> {
    const rows = await db.movements.orderBy("createdAt").reverse().toArray();
    return rows.filter((m) => !isDeleted(m));
  },

  async getMovement(id: string): Promise<Movement | null> {
    const m = (await db.movements.get(id)) ?? null;
    if (!m || isDeleted(m)) return null;
    return m;
  },

  async upsertMovement(m: Movement): Promise<void> {
    const now = nowIso();

    // backfill para callers viejos
    const next: Movement = {
      ...(m as any),
      updatedAt: (m as any).updatedAt ?? now,
      deletedAt: (m as any).deletedAt ?? null,
    };

    await db.movements.put(next);
    markDirty();
  },

  async deleteMovement(id: string): Promise<void> {
    const now = nowIso();
    const m = await db.movements.get(id);
    if (!m) return;

    // tombstone movimiento
    await db.movements.put({ ...(m as any), deletedAt: now, updatedAt: now });

    // tombstone PRs del movimiento
    const prs = await db.prEntries.where("movementId").equals(id).toArray();
    if (prs.length) {
      await db.prEntries.bulkPut(
        prs.map((e) => ({
          ...(e as any),
          deletedAt: now,
          updatedAt: now,
        })),
      );
    }

    markDirty();
  },

  async listPrEntries(movementId: string): Promise<PrEntry[]> {
    const rows = await db.prEntries
      .where("[movementId+updatedAt]")
      .between([movementId, Dexie.minKey], [movementId, Dexie.maxKey])
      .reverse()
      .toArray();

    return rows.filter((e) => !isDeleted(e));
  },

  async addPrEntry(e: PrEntry): Promise<void> {
    const now = nowIso();
    const next: PrEntry = {
      ...(e as any),
      updatedAt: (e as any).updatedAt ?? now,
      deletedAt: (e as any).deletedAt ?? null,
    };
    await db.prEntries.put(next);
    markDirty();
  },

  async upsertPrEntry(e: PrEntry): Promise<void> {
    const now = nowIso();
    const next: PrEntry = {
      ...(e as any),
      updatedAt: (e as any).updatedAt ?? now,
      deletedAt: (e as any).deletedAt ?? null,
    };
    await db.prEntries.put(next);
    markDirty();
  },

  async deletePrEntry(id: string): Promise<void> {
    const now = nowIso();
    const e = await db.prEntries.get(id);
    if (!e) return;
    await db.prEntries.put({ ...(e as any), deletedAt: now, updatedAt: now });
    markDirty();
  },
};
