// apps/web/src/storage/repo.ts
import {
  DEFAULT_PREFS,
  type Movement,
  type PrEntry,
  type UserPreferences,
} from "@repo/core";
import Dexie from "dexie";
import { db } from "./db";

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

export const repo = {
  async getPreferences(): Promise<UserPreferences> {
    const row = await db.preferences.get("prefs");
    const value = (row as any)?.value;

    if (isNewPrefsShape(value)) {
      const contexts = value.contexts ?? { kg: "olympic", lb: "crossfit" };
      const theme = value.theme ?? "system";

      if (!value.contexts || !value.theme) {
        const next: UserPreferences = { ...value, contexts, theme };
        await db.preferences.put({ id: "prefs", value: next });
        return next;
      }

      return value;
    }

    await db.preferences.put({ id: "prefs", value: DEFAULT_PREFS });
    return DEFAULT_PREFS;
  },

  async setPreferences(prefs: UserPreferences): Promise<void> {
    await db.preferences.put({ id: "prefs", value: prefs });
  },

  async listMovements(): Promise<Movement[]> {
    return db.movements.orderBy("createdAt").reverse().toArray();
  },

  async getMovement(id: string): Promise<Movement | null> {
    return (await db.movements.get(id)) ?? null;
  },

  async upsertMovement(m: Movement): Promise<void> {
    await db.movements.put(m);
  },

  async deleteMovement(id: string): Promise<void> {
    await db.movements.delete(id);
    await db.prEntries.where("movementId").equals(id).delete();
  },

  async listPrEntries(movementId: string): Promise<PrEntry[]> {
    // ordered by movementId then updatedAt (asc), we reverse to get latest first
    return db.prEntries
      .where("[movementId+updatedAt]")
      .between([movementId, Dexie.minKey], [movementId, Dexie.maxKey])
      .reverse()
      .toArray();
  },

  async addPrEntry(e: PrEntry): Promise<void> {
    await db.prEntries.put(e);
  },

  async upsertPrEntry(e: PrEntry): Promise<void> {
    await db.prEntries.put(e);
  },

  async deletePrEntry(id: string): Promise<void> {
    await db.prEntries.delete(id);
  },
};
