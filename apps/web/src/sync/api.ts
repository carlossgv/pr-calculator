/* FILE: apps/web/src/sync/api.ts */
import type {
  BootstrapRequest,
  BootstrapResponse,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
} from "@repo/api-contracts";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "/api";

export type ApiAuth = {
  deviceId: string;
  deviceToken: string;
};

async function req<T>(path: string, auth: ApiAuth, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Content-Type": "application/json",
      "X-Device-Id": auth.deviceId,
      Authorization: `Bearer ${auth.deviceToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
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
