// apps/web/src/storage/repo.ts
import { DEFAULT_PREFS, type Movement, type PrEntry, type UserPreferences } from "@repo/core";
import { db } from "./db";

function isNewPrefsShape(p: any): p is UserPreferences {
  return Boolean(
    p &&
      typeof p === "object" &&
      (p.defaultUnit === "kg" || p.defaultUnit === "lb") &&
      p.bar &&
      typeof p.bar.value === "number" &&
      (p.bar.unit === "kg" || p.bar.unit === "lb") &&
      Array.isArray(p.plates)
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
        const next = { ...value, contexts, theme };
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

  async upsertMovement(m: Movement): Promise<void> {
    await db.movements.put(m);
  },

  async deleteMovement(id: string): Promise<void> {
    await db.movements.delete(id);
    await db.prEntries.where("movementId").equals(id).delete();
  },

  async listPrEntries(movementId: string): Promise<PrEntry[]> {
    return db.prEntries.where("movementId").equals(movementId).reverse().toArray();
  },

  async addPrEntry(e: PrEntry): Promise<void> {
    await db.prEntries.put(e);
  },

  async deletePrEntry(id: string): Promise<void> {
    await db.prEntries.delete(id);
  },
};
