// apps/web/src/storage/db.ts
import Dexie, { type Table } from "dexie";
import type { Movement, PrEntry, UserPreferences } from "@repo/core";

export type PreferencesRow = { id: "prefs"; value: UserPreferences };

export class AppDb extends Dexie {
  preferences!: Table<PreferencesRow, "prefs">;
  movements!: Table<Movement, string>;
  prEntries!: Table<PrEntry, string>;

  constructor() {
    super("pr-calculator");
    this.version(1).stores({
      preferences: "id",
      movements: "id, createdAt",
      prEntries: "id, movementId, date",
    });
  }
}

export const db = new AppDb();
