import { describe, expect, it } from "vitest";
import type { PrEntry } from "@repo/core";
import { estimate1rmEpley } from "./1rm";
import { buildMovementTrendData } from "./movement-trends";

function entry(partial: Partial<PrEntry> & Pick<PrEntry, "id" | "date" | "weight" | "reps">): PrEntry {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    movementId: "m-1",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...partial,
  };
}

describe("estimate1rmEpley", () => {
  it("returns the input weight for single-rep lifts", () => {
    expect(estimate1rmEpley(100, 1)).toBe(100);
  });

  it("returns zero for invalid weights", () => {
    expect(estimate1rmEpley(-10, 5)).toBe(0);
  });
});

describe("buildMovementTrendData", () => {
  it("sorts entries by date and computes summary fields", () => {
    const out = buildMovementTrendData(
      [
        entry({
          id: "c",
          date: "2026-01-10T12:00:00.000Z",
          weight: 120,
          reps: 3,
        }),
        entry({
          id: "a",
          date: "2026-01-02T12:00:00.000Z",
          weight: 100,
          reps: 5,
        }),
        entry({
          id: "b",
          date: "2026-01-06T12:00:00.000Z",
          weight: 110,
          reps: 1,
        }),
      ],
      "kg",
      "en-US",
    );

    expect(out.points.map((point) => point.id)).toEqual(["a", "b", "c"]);
    expect(out.summary.entryCount).toBe(3);
    expect(out.summary.firstDate).toBe("2026-01-02T12:00:00.000Z");
    expect(out.summary.latestDate).toBe("2026-01-10T12:00:00.000Z");
    expect(out.summary.bestWeight).toEqual({
      weight: 120,
      reps: 3,
      date: "2026-01-10T12:00:00.000Z",
    });
    expect(out.summary.latestWeight).toEqual({
      weight: 120,
      reps: 3,
      date: "2026-01-10T12:00:00.000Z",
    });
    expect(out.summary.bestEstimated1rm).toEqual({
      weight: 120,
      reps: 3,
      date: "2026-01-10T12:00:00.000Z",
      estimated1rm: 132,
    });
    expect(out.summary.deltaFromFirst).toBe(20);
    expect(out.points[1]?.estimated1rm).toBeNull();
    expect(out.points[1]?.deltaFromPrevious).toBe(10);
  });

  it("omits estimated 1RM when reps are not above one", () => {
    const out = buildMovementTrendData(
      [
        entry({
          id: "a",
          date: "2026-01-02T12:00:00.000Z",
          weight: 100,
          reps: 1,
        }),
      ],
      "kg",
      "en-US",
    );

    expect(out.points[0]?.estimated1rm).toBeNull();
    expect(out.summary.bestEstimated1rm).toBeNull();
    expect(out.summary.deltaFromFirst).toBeNull();
  });

  it("handles an empty history", () => {
    const out = buildMovementTrendData([], "kg", "en-US");

    expect(out.points).toEqual([]);
    expect(out.summary).toEqual({
      entryCount: 0,
      firstDate: null,
      latestDate: null,
      bestWeight: null,
      latestWeight: null,
      bestEstimated1rm: null,
      deltaFromFirst: null,
    });
  });
});
