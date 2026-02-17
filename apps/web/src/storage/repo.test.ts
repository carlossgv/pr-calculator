import { beforeAll, beforeEach, describe, expect, it } from "vitest";
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
