import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../storage/db";
import { connectRecoveryAccount, finishRecoveryRestore, hasMeaningfulLocalData } from "./recovery";

const api = vi.hoisted(() => ({
  attachRecoveryDevice: vi.fn(),
  syncPull: vi.fn(),
}));

vi.mock("./api", () => ({
  ...api,
  getRecoveryStatus: vi.fn(),
  setupRecovery: vi.fn(),
  changeRecoveryId: vi.fn(),
  changeRecoveryPassword: vi.fn(),
}));
vi.mock("./sync", () => ({ forceSyncPush: vi.fn() }));

describe("recovery replacement data detection", () => {
  beforeEach(async () => {
    await db.movements.clear();
    await db.prEntries.clear();
    await db.preferences.clear();
    await db.meta.clear();
    await db.meta.bulkPut([
      { id: "deviceId", value: "device" },
      { id: "deviceToken", value: "token" },
      { id: "accountId", value: "source" },
    ]);
    vi.resetAllMocks();
  });

  it("ignores preferences-only local data", async () => {
    await db.preferences.put({ id: "prefs", value: {} as any });
    await expect(hasMeaningfulLocalData()).resolves.toBe(false);
  });

  it("detects movements and PR entries", async () => {
    await db.movements.put({ id: "movement", name: "Squat" } as any);
    await expect(hasMeaningfulLocalData()).resolves.toBe(true);
    await db.movements.clear();
    await db.prEntries.put({ id: "entry", movementId: "movement" } as any);
    await expect(hasMeaningfulLocalData()).resolves.toBe(true);
  });

  it("connects an empty or preferences-only device without replacement authorization", async () => {
    await db.preferences.put({ id: "prefs", value: { language: "en" } as any });
    api.attachRecoveryDevice.mockResolvedValue({ accountId: "target", recoveryId: "person-1" });
    api.syncPull.mockResolvedValue({ serverTimeMs: 10, preferences: null, movements: [], prEntries: [] });
    await connectRecoveryAccount("Person-1", "password1", false);
    await expect(db.meta.get("accountId")).resolves.toMatchObject({ value: "target" });
    await expect(db.meta.get("restorePhase")).resolves.toBeUndefined();
  });

  it("fully replaces local synchronized data with the target account", async () => {
    await db.movements.put({ id: "abandoned", name: "Old" } as any);
    api.attachRecoveryDevice.mockResolvedValue({ accountId: "target", recoveryId: "person-1" });
    api.syncPull.mockResolvedValue({
      serverTimeMs: 20,
      preferences: null,
      movements: [{ id: "target-movement", updatedAtMs: 1, value: { id: "target-movement", name: "New" } }],
      prEntries: [],
    });
    await connectRecoveryAccount("person-1", "password1", true);
    await expect(db.movements.get("abandoned")).resolves.toBeUndefined();
    await expect(db.movements.get("target-movement")).resolves.toBeDefined();
  });

  it("retains the restore barrier after interruption and completes on retry", async () => {
    await db.movements.put({ id: "abandoned", name: "Old" } as any);
    api.attachRecoveryDevice.mockResolvedValue({ accountId: "target", recoveryId: "person-1" });
    api.syncPull.mockRejectedValueOnce(new Error("offline"));
    await expect(connectRecoveryAccount("person-1", "password1", true)).rejects.toThrow("offline");
    await expect(db.meta.get("restorePhase")).resolves.toMatchObject({ value: "restoring" });
    expect(await db.movements.count()).toBe(1);

    api.syncPull.mockResolvedValue({ serverTimeMs: 30, preferences: null, movements: [], prEntries: [] });
    await finishRecoveryRestore();
    expect(await db.movements.count()).toBe(0);
    await expect(db.meta.get("restorePhase")).resolves.toBeUndefined();
  });
});
