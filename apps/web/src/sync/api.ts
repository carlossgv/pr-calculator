/* FILE: apps/web/src/sync/api.ts */
import type {
  BootstrapRequest,
  BootstrapResponse,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
  RecoveryCredentialSetupRequest,
  RecoveryDeviceAttachRequest,
  RecoveryDeviceAttachResponse,
  RecoveryIdChangeRequest,
  RecoveryPasswordChangeRequest,
  RecoveryStatusResponse,
} from "@repo/api-contracts";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "/api";
const DEBUG_HTTP = (import.meta as any).env?.VITE_DEBUG_HTTP === "1";

let printedBase = false;

function dbg(...args: any[]) {
  if (DEBUG_HTTP) console.log("[sync/http]", ...args);
}

function join(base: string, path: string) {
  const b = String(base).replace(/\/+$/, "");
  const p = String(path).startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export type ApiAuth = {
  deviceId: string;
  deviceToken: string;
};

async function req<T>(path: string, auth: ApiAuth | null, init?: RequestInit): Promise<T> {
  if (DEBUG_HTTP && !printedBase) {
    printedBase = true;
    dbg("API_BASE =", API_BASE);
  }

  const url = join(API_BASE, path);
  dbg("=>", init?.method ?? "GET", url, { deviceId: auth?.deviceId });

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Content-Type": "application/json",
      ...(auth ? { "X-Device-Id": auth.deviceId, Authorization: `Bearer ${auth.deviceToken}` } : {}),
    },
  });

  dbg("<=", res.status, url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    dbg("<= body", text.slice(0, 800));
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}

export async function bootstrap(auth: ApiAuth): Promise<BootstrapResponse> {
  const body: BootstrapRequest = {
    deviceId: auth.deviceId,
    deviceToken: auth.deviceToken,
    appVersion: (import.meta as any).env?.VITE_APP_VERSION,
  };
  return req<BootstrapResponse>("/v1/bootstrap", auth, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function syncPush(auth: ApiAuth, payload: SyncPushRequest): Promise<SyncPushResponse> {
  return req<SyncPushResponse>("/v1/sync/push", auth, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function syncPull(auth: ApiAuth, sinceMs: number): Promise<SyncPullResponse> {
  return req<SyncPullResponse>(`/v1/sync/pull?sinceMs=${encodeURIComponent(String(sinceMs))}`, auth);
}

export const getRecoveryStatus = (auth: ApiAuth) => req<RecoveryStatusResponse>("/v1/recovery", auth);
export const setupRecovery = (auth: ApiAuth, body: RecoveryCredentialSetupRequest) =>
  req<RecoveryStatusResponse>("/v1/recovery", auth, { method: "POST", body: JSON.stringify(body) });
export const changeRecoveryId = (auth: ApiAuth, body: RecoveryIdChangeRequest) =>
  req<RecoveryStatusResponse>("/v1/recovery/id", auth, { method: "PATCH", body: JSON.stringify(body) });
export const changeRecoveryPassword = (auth: ApiAuth, body: RecoveryPasswordChangeRequest) =>
  req<RecoveryStatusResponse>("/v1/recovery/password", auth, { method: "PATCH", body: JSON.stringify(body) });
export const attachRecoveryDevice = (body: RecoveryDeviceAttachRequest) =>
  req<RecoveryDeviceAttachResponse>("/v1/recovery/connect", null, { method: "POST", body: JSON.stringify(body) });
