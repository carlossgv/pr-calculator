import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  preferences: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  movement: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
  prEntry: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
};

vi.mock("../src/prisma", () => ({ prisma: prismaMock }));

describe("SyncController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("push accepts only newer movement rows", async () => {
    const { SyncController } = await import("../src/sync.controller");
    const controller = new SyncController();

    prismaMock.movement.findUnique.mockResolvedValueOnce({
      id: "m-1",
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    });

    prismaMock.movement.findUnique.mockResolvedValueOnce({
      id: "m-2",
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const out = await controller.push(
      { accountId: "acc-1", deviceId: "dev-1", headers: {} } as any,
      {
        clientTimeMs: Date.now(),
        sinceMs: 0,
        movements: [
          {
            id: "m-1",
            updatedAtMs: new Date("2026-01-01T12:00:00.000Z").getTime(),
            deletedAtMs: null,
            value: { id: "m-1", name: "Bench" },
          },
          {
            id: "m-2",
            updatedAtMs: new Date("2026-01-03T00:00:00.000Z").getTime(),
            deletedAtMs: null,
            value: { id: "m-2", name: "Squat" },
          },
        ],
        prEntries: [],
      } as any,
    );

    expect(out.accepted).toBe(1);
    expect(prismaMock.movement.upsert).toHaveBeenCalledTimes(1);
  });

  it("pull maps DB rows into sync envelopes", async () => {
    const { SyncController } = await import("../src/sync.controller");
    const controller = new SyncController();

    prismaMock.preferences.findUnique.mockResolvedValue({
      accountId: "acc-1",
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      deletedAt: null,
      value: { defaultUnit: "kg" },
    });
    prismaMock.movement.findMany.mockResolvedValue([
      {
        id: "m-1",
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
        deletedAt: null,
        value: { id: "m-1", name: "Bench" },
      },
    ]);
    prismaMock.prEntry.findMany.mockResolvedValue([
      {
        id: "pr-1",
        updatedAt: new Date("2026-01-03T00:00:00.000Z"),
        deletedAt: null,
        value: { id: "pr-1", movementId: "m-1", weight: 100, reps: 3 },
      },
    ]);

    const out = await controller.pull(
      { accountId: "acc-1", deviceId: "dev-1", headers: {} } as any,
      "0",
    );

    expect(out.preferences?.id).toBe("prefs");
    expect(out.movements).toHaveLength(1);
    expect(out.prEntries).toHaveLength(1);
    expect(out.movements[0].id).toBe("m-1");
    expect(out.prEntries[0].id).toBe("pr-1");
  });
});
