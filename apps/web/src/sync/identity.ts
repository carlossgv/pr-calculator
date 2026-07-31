/* FILE: apps/web/src/sync/identity.ts */
import { db } from "../storage/db";

const DEBUG_ID = (import.meta as any).env?.VITE_DEBUG_IDENTITY === "1";

// keys legacy (auth.ts)
const LS_KEY_ID = "prcalc_deviceId";
const LS_KEY_TOKEN = "prcalc_deviceToken";

function dbg(...args: any[]) {
  if (DEBUG_ID) console.log("[sync/identity]", ...args);
}

function base64Url(bytes: Uint8Array) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  const b64 = btoa(str);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomBytes(n: number) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();

  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function mask(s: string, head = 6, tail = 4) {
  if (!s) return "";
  if (s.length <= head + tail) return `${s.slice(0, 2)}…`;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export type Identity = {
  deviceId: string;
  deviceToken: string;
  accountId?: string;
  lastSyncMs?: number;
  recoveryId?: string;
  restorePhase?: "attaching" | "restoring";
};

export async function getOrCreateIdentity(): Promise<Identity> {
  const [deviceIdRow, deviceTokenRow, accountIdRow, lastSyncRow, recoveryIdRow, restorePhaseRow] =
    await Promise.all([
      db.meta.get("deviceId"),
      db.meta.get("deviceToken"),
      db.meta.get("accountId"),
      db.meta.get("lastSyncMs"),
      db.meta.get("recoveryId"),
      db.meta.get("restorePhase"),
    ]);

  let deviceId = (deviceIdRow as any)?.value as string | undefined;
  let deviceToken = (deviceTokenRow as any)?.value as string | undefined;

  if (!deviceId || !deviceToken) {
    deviceId = uuid();
    deviceToken = base64Url(randomBytes(32));
    await db.meta.put({ id: "deviceId", value: deviceId });
    await db.meta.put({ id: "deviceToken", value: deviceToken });
    dbg("created", { deviceId, deviceToken: mask(deviceToken) });
  } else {
    dbg("loaded", { deviceId, deviceToken: mask(deviceToken) });
  }

  // 🔥 Detecta si existe identidad distinta en localStorage (auth.ts)
  try {
    const lsId = window.localStorage.getItem(LS_KEY_ID) ?? "";
    const lsTok = window.localStorage.getItem(LS_KEY_TOKEN) ?? "";

    if ((lsId && lsId !== deviceId) || (lsTok && lsTok !== deviceToken)) {
      dbg("WARNING mismatch between Dexie(meta) and localStorage(auth.ts)", {
        dexie: { deviceId, deviceToken: mask(deviceToken) },
        localStorage: { deviceId: lsId || "∅", deviceToken: lsTok ? mask(lsTok) : "∅" },
      });
    }
  } catch {
    // ignore
  }

  return {
    deviceId,
    deviceToken,
    accountId: (accountIdRow as any)?.value as string | undefined,
    lastSyncMs: (lastSyncRow as any)?.value as number | undefined,
    recoveryId: (recoveryIdRow as any)?.value as string | undefined,
    restorePhase: (restorePhaseRow as any)?.value as Identity["restorePhase"],
  };
}

export async function setAccountId(accountId: string) {
  await db.meta.put({ id: "accountId", value: accountId });
}

export async function getSupportId(): Promise<string> {
  const row = await db.meta.get("deviceId");
  return ((row as any)?.value as string) ?? "";
}

export async function getLastSyncMs(): Promise<number> {
  const row = await db.meta.get("lastSyncMs");
  return ((row as any)?.value as number) ?? 0;
}

export async function setLastSyncMs(ms: number) {
  await db.meta.put({ id: "lastSyncMs", value: ms });
}

export async function setRecoveryId(recoveryId: string | null) {
  if (recoveryId) await db.meta.put({ id: "recoveryId", value: recoveryId });
  else await db.meta.delete("recoveryId");
}

export async function setRestorePhase(phase: Identity["restorePhase"] | null) {
  if (phase) await db.meta.put({ id: "restorePhase", value: phase });
  else await db.meta.delete("restorePhase");
}
