import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_PREFS } from "@repo/core";
import { db } from "./db";
import { repo } from "./repo";

describe("repo", () => {
  beforeAll(async () => {
    await db.open();
  });

  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("seeds default preferences when missing", async () => {
    const prefs = await repo.getPreferences();
    expect(prefs.defaultUnit).toBe("kg");

    const row = await db.preferences.get("prefs");
    expect(row?.id).toBe("prefs");
  });

  it("backfills missing rounding for older stored preferences", async () => {
    const legacyPrefs = {
      ...DEFAULT_PREFS,
      rounding: undefined,
    };

    await db.preferences.put({ id: "prefs", value: legacyPrefs as any });

    const prefs = await repo.getPreferences();
    expect(prefs.rounding).toEqual(DEFAULT_PREFS.rounding);

    const row = await db.preferences.get("prefs");
    expect((row?.value as any).rounding).toEqual(DEFAULT_PREFS.rounding);
  });

  it("sanitizes quick calculator draft and caps custom percentages", async () => {
    await repo.setQuickCalculatorDraft({
      unit: "lb",
      weight: 200,
      customPcts: [100, 95.04, 95.0, -10, 301, 90, 85, 80, 75, 70, 65],
    });

    const draft = await repo.getQuickCalculatorDraft();
    expect(draft).not.toBeNull();
    expect(draft?.unit).toBe("lb");
    expect(draft?.customPcts).toEqual([100, 95, 90, 85, 80, 75, 70, 65]);
  });

  it("sanitizes workout planner draft and keeps sequence order", async () => {
    await repo.setWorkoutPlannerDraft("m-1", {
      precision: 88.4,
      order: "asc",
      customPcts: [75, 75, 101, 62.55, 62.5, -1],
      sequence: [80, 80, 60, 0, 301],
    });

    const draft = await repo.getWorkoutPlannerDraft("m-1");
    expect(draft).not.toBeNull();
    expect(draft?.precision).toBe(88);
    expect(draft?.order).toBe("asc");
    expect(draft?.customPcts).toEqual([101, 75, 62.6, 62.5]);
    expect(draft?.sequence).toEqual([80, 80, 60]);
  });

  it("converts pr entries unit and updates weight", async () => {
    await db.prEntries.put({
      id: "pr-1",
      movementId: "m-1",
      weight: 100,
      reps: 3,
      date: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      deletedAt: null,
    });

    await repo.convertPrEntriesUnit("kg", "lb");
    const row = await db.prEntries.get("pr-1");

    expect(row).not.toBeUndefined();
    expect(row?.weight).toBeCloseTo(220.5, 1);
    expect(row?.updatedAt).not.toBe("2026-01-01T00:00:00.000Z");
  });
});
