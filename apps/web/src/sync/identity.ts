/* FILE: apps/web/src/sync/identity.ts */
import { db } from "../storage/db";

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

export type Identity = {
  deviceId: string;
  deviceToken: string;
  accountId?: string;
  lastSyncMs?: number;
};

export async function getOrCreateIdentity(): Promise<Identity> {
  const [deviceIdRow, deviceTokenRow, accountIdRow, lastSyncRow] =
    await Promise.all([
      db.meta.get("deviceId"),
      db.meta.get("deviceToken"),
      db.meta.get("accountId"),
      db.meta.get("lastSyncMs"),
    ]);

  let deviceId = (deviceIdRow as any)?.value as string | undefined;
  let deviceToken = (deviceTokenRow as any)?.value as string | undefined;

  if (!deviceId || !deviceToken) {
    deviceId = uuid();
    deviceToken = base64Url(randomBytes(32));
    await db.meta.put({ id: "deviceId", value: deviceId });
    await db.meta.put({ id: "deviceToken", value: deviceToken });
  }

  return {
    deviceId,
    deviceToken,
    accountId: (accountIdRow as any)?.value as string | undefined,
    lastSyncMs: (lastSyncRow as any)?.value as number | undefined,
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
