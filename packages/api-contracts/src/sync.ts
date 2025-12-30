import { UserPreferences } from "../../core/src/types";

/* FILE: packages/api-contracts/src/sync.ts */
export type IsoEpochMs = number;

export type BootstrapRequest = {
  deviceId: string; // uuid
  deviceToken: string; // base64url
  appVersion?: string;
};

export type BootstrapResponse = {
  accountId: string; // uuid
  deviceId: string; // uuid
  serverTimeMs: IsoEpochMs;
};

export type SyncEntityEnvelope<T> = {
  id: string;
  updatedAtMs: IsoEpochMs;
  deletedAtMs?: IsoEpochMs | null;
  value: T | null; // null cuando es tombstone puro
};

export type SyncPushRequest = {
  clientTimeMs: IsoEpochMs;
  // opcional: cursor local para debugging
  sinceMs?: IsoEpochMs;

  preferences?: SyncEntityEnvelope<UserPreferences>; // 1 doc
  movements?: SyncEntityEnvelope<any>[];
  prEntries?: SyncEntityEnvelope<any>[];
};

export type SyncPushResponse = {
  accepted: number;
  serverTimeMs: IsoEpochMs;
};

export type SyncPullResponse = {
  serverTimeMs: IsoEpochMs;
  // todo lo modificado desde since
  preferences?: SyncEntityEnvelope<any> | null;
  movements: SyncEntityEnvelope<any>[];
  prEntries: SyncEntityEnvelope<any>[];
};
