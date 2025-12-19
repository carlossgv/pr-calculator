// FILE: apps/web/src/storage/db.ts
import Dexie, { type Table } from "dexie";
import type { Movement, PrEntry, UserPreferences } from "@repo/core";

export type PreferencesRow = { id: "prefs"; value: UserPreferences };

// ✅ simple KV store para identity / sync
export type MetaRow = { id: string; value: any };

export class AppDb extends Dexie {
  preferences!: Table<PreferencesRow, "prefs">;
  movements!: Table<Movement, string>;
  prEntries!: Table<PrEntry, string>;
  // ✅ new
  meta!: Table<MetaRow, string>;

  constructor() {
    super("pr-calculator");

    // v1 (legacy)
    this.version(1).stores({
      preferences: "id",
      movements: "id, createdAt",
      prEntries: "id, movementId, date, createdAt, updatedAt, [movementId+updatedAt]",
    });

    // v2: tombstones + updatedAt en movements + index por deletedAt
    this.version(2)
      .stores({
        preferences: "id",
        movements: "id, createdAt, updatedAt, deletedAt",
        prEntries: "id, movementId, date, createdAt, updatedAt, deletedAt, [movementId+updatedAt]",
      })
      .upgrade(async (tx) => {
        const movTbl = tx.table("movements");
        const prTbl = tx.table("prEntries");

        await movTbl.toCollection().modify((m: any) => {
          if (!m.updatedAt) m.updatedAt = m.createdAt ?? new Date().toISOString();
          if (typeof m.deletedAt === "undefined") m.deletedAt = null;
        });

        await prTbl.toCollection().modify((e: any) => {
          if (typeof e.deletedAt === "undefined") e.deletedAt = null;
        });
      });

    // ✅ v3: add meta table
    this.version(3).stores({
      preferences: "id",
      movements: "id, createdAt, updatedAt, deletedAt",
      prEntries: "id, movementId, date, createdAt, updatedAt, deletedAt, [movementId+updatedAt]",
      meta: "id",
    });
  }
}

export const db = new AppDb();
