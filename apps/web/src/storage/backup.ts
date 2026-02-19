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

function downloadJsonFallback(filename: string, json: string) {
  const blob = new Blob([json], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type NativeBackupExportPlugin = {
  saveJson: (opts: {
    filename: string;
    json: string;
    mimeType?: string;
  }) => Promise<{ uri?: string }>;
};

type NativeCapacitorBridge = {
  Plugins?: {
    BackupExport?: NativeBackupExportPlugin;
  };
};

function getNativeBackupExportPlugin(): NativeBackupExportPlugin | null {
  const bridge = (window as { Capacitor?: NativeCapacitorBridge }).Capacitor;
  return bridge?.Plugins?.BackupExport ?? null;
}

async function saveWithFileSystemPicker(
  filename: string,
  json: string,
): Promise<boolean> {
  const picker = (window as any).showSaveFilePicker;
  if (typeof picker !== "function") return false;

  const handle = await picker({
    suggestedName: filename,
    types: [
      {
        description: "JSON",
        accept: { "application/json": [".json"] },
      },
    ],
  });

  const writable = await handle.createWritable();
  await writable.write(json);
  await writable.close();
  return true;
}

async function saveWithNativePicker(
  filename: string,
  json: string,
): Promise<boolean> {
  const plugin = getNativeBackupExportPlugin();
  if (!plugin?.saveJson) return false;
  await plugin.saveJson({
    filename,
    json,
    mimeType: "application/json",
  });
  return true;
}

export function isBackupSaveCancelledError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const maybe = err as { name?: string; message?: string };
  if (maybe.name === "AbortError") return true;
  return typeof maybe.message === "string" && maybe.message.includes("USER_CANCELLED");
}

export async function saveJson(filename: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2);

  if (await saveWithFileSystemPicker(filename, json)) return;
  if (await saveWithNativePicker(filename, json)) return;

  // Fallback for unsupported platforms.
  downloadJsonFallback(filename, json);
}
