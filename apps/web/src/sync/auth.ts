/* FILE: apps/web/src/sync/auth.ts */
/**
 * @deprecated DO NOT USE.
 * Identity/auth lives in Dexie meta: `apps/web/src/sync/identity.ts`.
 * This file exists only to avoid breaking old imports in historical commits.
 */
import type { ApiAuth } from "./api";

const IS_DEV =
  (import.meta as any).env?.DEV === true ||
  (import.meta as any).env?.MODE === "development";

export function getAuthOrNull(): ApiAuth | null {
  if (IS_DEV) {
    throw new Error(
      "[sync/auth] Deprecated. Use getOrCreateIdentity() from ./identity.ts",
    );
  }
  return null;
}

export function getOrCreateAuth(): ApiAuth {
  throw new Error(
    "[sync/auth] Deprecated. Use getOrCreateIdentity() from ./identity.ts",
  );
}
