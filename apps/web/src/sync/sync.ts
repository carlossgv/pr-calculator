/* FILE: apps/web/src/sync/sync.ts */
import type { Movement, PrEntry, UserPreferences } from "@repo/core";
import type { SyncEntityEnvelope, SyncPushRequest } from "@repo/api-contracts";
import { db } from "../storage/db";
import { consumeDirty, subscribeChanges } from "../storage/changes";
import { bootstrap, syncPull, syncPush } from "./api";
import {
  getLastSyncMs,
  getOrCreateIdentity,
  setAccountId,
  setLastSyncMs,
} from "./identity";

function nowMs() {
  return Date.now();
}

function msToIso(ms: number) {
  return new Date(ms).toISOString();
}

function isoToMs(iso: any): number | null {
  if (!iso) return null;
  if (typeof iso === "number") return iso;
  if (typeof iso === "string") {
    const d = Date.parse(iso);
    return Number.isNaN(d) ? null : d;
  }
  return null;
}

function asEnvelope<T>(
  id: string,
  updatedAtMs: number,
  value: T | null,
  deletedAtMs?: number | null,
): SyncEntityEnvelope<T> {
  return { id, updatedAtMs, value, deletedAtMs: deletedAtMs ?? null };
}

function coerceUpdatedAtMs(x: any): number {
  const ms = isoToMs(x);
  return ms ?? nowMs();
}

function coerceDeletedAtMs(x: any): number | null {
  return isoToMs(x);
}

function isDeleted(obj: any): boolean {
  return Boolean(obj && (obj.deletedAt || obj.deletedAtMs));
}

async function buildPushPayload(sinceMs: number): Promise<SyncPushRequest> {
  const clientTimeMs = nowMs();

  // Preferences (single)
  const prefsRow = await db.preferences.get("prefs");
  const prefs = (prefsRow as any)?.value as UserPreferences | undefined;
  const prefsEnv = prefs
    ? asEnvelope("prefs", clientTimeMs, prefs as any, null)
    : undefined;

  // Movements
  const movements = await db.movements.toArray();
  const movementsEnv = movements.map((m: any) =>
    asEnvelope(
      m.id,
      coerceUpdatedAtMs(m.updatedAt ?? m.createdAt),
      isDeleted(m) ? null : (m as Movement),
      coerceDeletedAtMs(m.deletedAt ?? m.deletedAtMs),
    ),
  );

  // PRs
  const prEntries = await db.prEntries.toArray();
  const prEntriesEnv = prEntries.map((e: any) =>
    asEnvelope(
      e.id,
      coerceUpdatedAtMs(e.updatedAt ?? e.createdAt),
      isDeleted(e) ? null : (e as PrEntry),
      coerceDeletedAtMs(e.deletedAt ?? e.deletedAtMs),
    ),
  );

  return {
    clientTimeMs,
    sinceMs,
    preferences: prefsEnv as any,
    movements: movementsEnv as any,
    prEntries: prEntriesEnv as any,
  };
}

async function applyPull(pull: Awaited<ReturnType<typeof syncPull>>) {
  // preferences
  if (pull.preferences?.value) {
    await db.preferences.put({ id: "prefs", value: pull.preferences.value as any });
  }

  const upsertMovementFromEnv = async (env: any) => {
    const updatedAtIso = msToIso(env.updatedAtMs);
    const deletedAtIso = env.deletedAtMs ? msToIso(env.deletedAtMs) : null;

    if (env.value) {
      const v = env.value as any;
      await db.movements.put({
        ...v,
        updatedAt: v.updatedAt ?? updatedAtIso,
        deletedAt: deletedAtIso,
      });
      return;
    }

    // tombstone sin value: marcamos deleted/updated si existe; si no existe, guardamos mínimo
    const existing = await db.movements.get(env.id);
    if (existing) {
      await db.movements.put({
        ...(existing as any),
        updatedAt: updatedAtIso,
        deletedAt: deletedAtIso ?? (existing as any).deletedAt ?? null,
      });
      return;
    }

    await db.movements.put({
      id: env.id,
      name: "",
      createdAt: updatedAtIso,
      updatedAt: updatedAtIso,
      deletedAt: deletedAtIso ?? updatedAtIso,
    } as any);
  };

  const upsertPrFromEnv = async (env: any) => {
    const updatedAtIso = msToIso(env.updatedAtMs);
    const deletedAtIso = env.deletedAtMs ? msToIso(env.deletedAtMs) : null;

    if (env.value) {
      const v = env.value as any;
      await db.prEntries.put({
        ...v,
        updatedAt: v.updatedAt ?? updatedAtIso,
        deletedAt: deletedAtIso,
      });
      return;
    }

    const existing = await db.prEntries.get(env.id);
    if (existing) {
      await db.prEntries.put({
        ...(existing as any),
        updatedAt: updatedAtIso,
        deletedAt: deletedAtIso ?? (existing as any).deletedAt ?? null,
      });
      return;
    }

    // mínimo (ojo con index compuesto: movementId debe existir)
    await db.prEntries.put({
      id: env.id,
      movementId: "__deleted__",
      weight: 0,
      reps: 0,
      date: updatedAtIso,
      createdAt: updatedAtIso,
      updatedAt: updatedAtIso,
      deletedAt: deletedAtIso ?? updatedAtIso,
    } as any);
  };

  if (pull.movements?.length) {
    await db.transaction("rw", db.movements, async () => {
      for (const env of pull.movements as any[]) await upsertMovementFromEnv(env);
    });
  }

  if (pull.prEntries?.length) {
    await db.transaction("rw", db.prEntries, async () => {
      for (const env of pull.prEntries as any[]) await upsertPrFromEnv(env);
    });
  }
}

let started = false;
let pushing = false;
let pullInFlight = false;
let debounceTimer: number | null = null;

async function doPull(auth: { deviceId: string; deviceToken: string }) {
  if (pullInFlight) return;
  pullInFlight = true;
  try {
    const sinceMs = await getLastSyncMs();
    const pull = await syncPull(auth, sinceMs);
    await applyPull(pull);
    await setLastSyncMs(pull.serverTimeMs);
  } finally {
    pullInFlight = false;
  }
}

async function doPush(auth: { deviceId: string; deviceToken: string }) {
  if (pushing) return;
  pushing = true;
  try {
    const sinceMs = await getLastSyncMs();
    const payload = await buildPushPayload(sinceMs);
    await syncPush(auth, payload);
  } finally {
    pushing = false;
  }
}

function schedulePush(auth: { deviceId: string; deviceToken: string }) {
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(async () => {
    debounceTimer = null;

    if (!consumeDirty()) return;

    try {
      await doPush(auth);
      await doPull(auth);
    } catch {
      // best-effort
    }
  }, 2500);
}

export async function initSync() {
  if (started) return;
  started = true;

  const id = await getOrCreateIdentity();
  const auth = { deviceId: id.deviceId, deviceToken: id.deviceToken };

  try {
    const b = await bootstrap(auth);
    await setAccountId(b.accountId);
    // mantenemos lastSyncMs (no lo “subimos” aquí)
    await setLastSyncMs(Math.max(await getLastSyncMs(), 0));
  } catch {
    // offline ok
  }

  try {
    await doPull(auth);
  } catch {
    // offline ok
  }

  subscribeChanges(() => schedulePush(auth));

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "visible") doPull(auth).catch(() => {});
    },
    { passive: true },
  );

  window.setInterval(() => {
    doPull(auth).catch(() => {});
  }, 30 * 60 * 1000);
}
