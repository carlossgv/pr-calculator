/* FILE: apps/web/src/sync/sync.ts */
import type { Movement, PrEntry, UserPreferences } from "@repo/core";
import type {
  SyncEntityEnvelope,
  SyncPushRequest,
  SyncPushResponse,
  SyncPullResponse,
} from "@repo/api-contracts";
import { db } from "../storage/db";
import { consumeDirty, subscribeChanges } from "../storage/changes";
import { bootstrap, syncPull, syncPush } from "./api";
import {
  getLastSyncMs,
  getOrCreateIdentity,
  setAccountId,
  setLastSyncMs,
} from "./identity";
import { repo } from "../storage/repo";
import { setLanguage } from "../i18n/strings";

const DEBUG_SYNC = (import.meta as any).env?.VITE_DEBUG_SYNC === "1";

function dbg(...args: any[]) {
  if (DEBUG_SYNC) console.log("[sync]", ...args);
}

function mask(s: string, head = 6, tail = 4) {
  if (!s) return "";
  if (s.length <= head + tail) return `${s.slice(0, 2)}…`;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

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

function isAuthError(e: unknown): boolean {
  const msg = (e as any)?.message ? String((e as any).message) : "";
  // nuestro req() en api.ts lanza: `API ${path} failed: ${status} ${text}`
  // el text del API incluye: {"message":"Unknown device","error":"Unauthorized","statusCode":401}
  return (
    msg.includes(" 401 ") ||
    msg.includes("Unauthorized") ||
    msg.includes("Unknown device") ||
    msg.includes("Bad token") ||
    msg.includes("Missing device auth")
  );
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

async function applyPull(pull: SyncPullResponse) {
  // preferences
  if (pull.preferences?.value) {
    await db.preferences.put({
      id: "prefs",
      value: pull.preferences.value as any,
    });

    // Opción 2: repo es la fuente de verdad (backfill + shape)
    try {
      const next = await repo.getPreferences();
      setLanguage(next.language);
    } catch {}
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
      for (const env of pull.movements as any[])
        await upsertMovementFromEnv(env);
    });
  }

  if (pull.prEntries?.length) {
    await db.transaction("rw", db.prEntries, async () => {
      for (const env of pull.prEntries as any[]) await upsertPrFromEnv(env);
    });
  }
}

// Prevent bootstrap storms
let bootstrapInFlight: Promise<void> | null = null;

async function ensureBootstrapped(auth: {
  deviceId: string;
  deviceToken: string;
}) {
  if (bootstrapInFlight) return bootstrapInFlight;

  bootstrapInFlight = (async () => {
    dbg("bootstrap => start", {
      deviceId: auth.deviceId,
      token: mask(auth.deviceToken),
    });
    const b = await bootstrap(auth);
    await setAccountId(b.accountId);
    await setLastSyncMs(Math.max(await getLastSyncMs(), 0));
    dbg("bootstrap <= ok", {
      accountId: b.accountId,
      serverTimeMs: b.serverTimeMs,
    });
  })()
    .catch((e) => {
      dbg("bootstrap <= fail", e);
      throw e;
    })
    .finally(() => {
      bootstrapInFlight = null;
    });

  return bootstrapInFlight;
}

async function withSelfHeal<T>(
  auth: { deviceId: string; deviceToken: string },
  opName: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!isAuthError(e)) throw e;

    // Self-heal: bootstrap + retry once
    dbg(`${opName} auth error -> self-heal`, e);
    await ensureBootstrapped(auth);
    return await fn();
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

    const pull = await withSelfHeal(auth, "pull", async () => {
      dbg("pull =>", { sinceMs });
      return await syncPull(auth, sinceMs);
    });

    await applyPull(pull);
    await setLastSyncMs(pull.serverTimeMs);

    dbg("pull <= ok", { serverTimeMs: pull.serverTimeMs });
  } catch (e) {
    dbg("pull <= fail", e);
    // best-effort (offline ok)
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

    if (DEBUG_SYNC) {
      const prefs = payload.preferences ? 1 : 0;
      const mov = Array.isArray(payload.movements)
        ? payload.movements.length
        : 0;
      const prs = Array.isArray(payload.prEntries)
        ? payload.prEntries.length
        : 0;
      dbg("push payload", {
        sinceMs,
        prefs,
        movements: mov,
        prEntries: prs,
        clientTimeMs: payload.clientTimeMs,
      });
    }

    const res: SyncPushResponse = await withSelfHeal(auth, "push", async () => {
      dbg("push =>", { sinceMs });
      return await syncPush(auth, payload);
    });

    dbg("push <= ok", res);
  } catch (e) {
    dbg("push <= fail", e);
    // best-effort
  } finally {
    pushing = false;
  }
}

function schedulePush(auth: { deviceId: string; deviceToken: string }) {
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(async () => {
    debounceTimer = null;

    if (!consumeDirty()) {
      dbg("schedulePush: no dirty -> skip");
      return;
    }

    await doPush(auth);
    await doPull(auth);
  }, 2500);
}

export async function initSync() {
  if (started) return;
  started = true;

  const id = await getOrCreateIdentity();
  const auth = { deviceId: id.deviceId, deviceToken: id.deviceToken };

  dbg("initSync", {
    deviceId: auth.deviceId,
    token: mask(auth.deviceToken),
    accountId: id.accountId ?? "∅",
    lastSyncMs: id.lastSyncMs ?? 0,
  });

  // Bootstrap best effort, pero ahora loggeado
  try {
    await ensureBootstrapped(auth);
  } catch {
    // offline ok
  }

  // Pull inicial
  await doPull(auth);

  subscribeChanges(() => schedulePush(auth));

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "visible") doPull(auth).catch(() => {});
    },
    { passive: true },
  );

  window.setInterval(
    () => {
      doPull(auth).catch(() => {});
    },
    30 * 60 * 1000,
  );
}
