// FILE: apps/web/src/storage/backup.ts
import { db } from "./db";
import type { Movement, PrEntry, UserPreferences } from "@repo/core";
import { markDirty } from "./changes";

export type BackupV1 = {
  version: 1;
  exportedAt: string;
  preferences: UserPreferences;
  movements: Movement[];
  prEntries: PrEntry[];
};

export async function exportBackup(): Promise<BackupV1> {
  const [prefsRow, movements, prEntries] = await Promise.all([
    db.preferences.get("prefs"),
    db.movements.toArray(),
    db.prEntries.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    preferences: (prefsRow as any)?.value,
    movements,
    prEntries,
  };
}

function isBackupV1(x: any): x is BackupV1 {
  return Boolean(
    x &&
      x.version === 1 &&
      typeof x.exportedAt === "string" &&
      x.preferences &&
      Array.isArray(x.movements) &&
      Array.isArray(x.prEntries),
  );
}

export async function importBackup(raw: unknown): Promise<void> {
  if (!isBackupV1(raw)) throw new Error("Invalid backup file");

  const b = raw;

  await db.transaction("rw", db.preferences, db.movements, db.prEntries, async () => {
    await db.preferences.put({ id: "prefs", value: b.preferences });

    await db.movements.clear();
    await db.prEntries.clear();

    if (b.movements.length) await db.movements.bulkPut(b.movements);
    if (b.prEntries.length) await db.prEntries.bulkPut(b.prEntries);
  });

  // importante: esto debe empujar al server eventualmente
  markDirty();
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
