import type { RecoveryStatusResponse } from "@repo/api-contracts";
import { db } from "../storage/db";
import { attachRecoveryDevice, changeRecoveryId, changeRecoveryPassword, getRecoveryStatus, setupRecovery, syncPull } from "./api";
import { getOrCreateIdentity, setAccountId, setLastSyncMs, setRecoveryId, setRestorePhase } from "./identity";
import { forceSyncPush } from "./sync";

function auth(identity: Awaited<ReturnType<typeof getOrCreateIdentity>>) {
  return { deviceId: identity.deviceId, deviceToken: identity.deviceToken };
}

export async function refreshRecoveryStatus(): Promise<RecoveryStatusResponse> {
  const identity = await getOrCreateIdentity();
  const status = await getRecoveryStatus(auth(identity));
  await setRecoveryId(status.recoveryId);
  return status;
}

export async function createRecoveryCredentials(recoveryId: string, password: string) {
  await forceSyncPush();
  const identity = await getOrCreateIdentity();
  const status = await setupRecovery(auth(identity), { recoveryId: recoveryId.toLowerCase(), password });
  await setRecoveryId(status.recoveryId);
  return status;
}

export async function renameRecoveryId(recoveryId: string) {
  const identity = await getOrCreateIdentity();
  const status = await changeRecoveryId(auth(identity), { recoveryId: recoveryId.toLowerCase() });
  await setRecoveryId(status.recoveryId);
  return status;
}

export async function resetRecoveryPassword(password: string) {
  const identity = await getOrCreateIdentity();
  return changeRecoveryPassword(auth(identity), { password });
}

export async function hasMeaningfulLocalData() {
  const [movements, entries] = await Promise.all([db.movements.count(), db.prEntries.count()]);
  return movements > 0 || entries > 0;
}

export async function connectRecoveryAccount(recoveryId: string, password: string, replaceLocalData: boolean) {
  const identity = await getOrCreateIdentity();
  await setRestorePhase("attaching");
  try {
    const connected = await attachRecoveryDevice({
      deviceId: identity.deviceId,
      deviceToken: identity.deviceToken,
      recoveryId: recoveryId.toLowerCase(),
      password,
      replaceLocalData,
    });
    await setAccountId(connected.accountId);
    await setRecoveryId(connected.recoveryId);
    await setRestorePhase("restoring");
    await finishRecoveryRestore();
    return connected;
  } catch (error) {
    const latest = await getOrCreateIdentity();
    if (latest.restorePhase === "attaching") await setRestorePhase(null);
    throw error;
  }
}

export async function finishRecoveryRestore() {
  const identity = await getOrCreateIdentity();
  if (identity.restorePhase !== "restoring") return;
  const pull = await syncPull(auth(identity), 0);
  await db.transaction("rw", db.preferences, db.movements, db.prEntries, db.meta, async () => {
    await db.preferences.clear();
    await db.movements.clear();
    await db.prEntries.clear();
    if (pull.preferences?.value) await db.preferences.put({ id: "prefs", value: pull.preferences.value });
    for (const item of pull.movements) if (item.value) await db.movements.put(item.value);
    for (const item of pull.prEntries) if (item.value) await db.prEntries.put(item.value);
    await setLastSyncMs(pull.serverTimeMs);
    await setRestorePhase(null);
  });
}
