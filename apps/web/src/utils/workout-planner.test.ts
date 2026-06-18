import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, type UserPreferences } from "@repo/core";
import { prefsForUnit } from "./equipment";
import { planWorkoutLoads } from "./workout-planner";

function makePrefs(partial?: Partial<UserPreferences>): UserPreferences {
  return { ...DEFAULT_PREFS, ...partial };
}

describe("planWorkoutLoads", () => {
  it("keeps repeated percentages on the same plate setup", () => {
    const prefs = makePrefs({
      bar: { value: 20, unit: "kg", label: "20 kg bar" },
      plates: [
        { value: 25, unit: "kg" },
        { value: 20, unit: "kg" },
        { value: 10, unit: "kg" },
        { value: 5, unit: "kg" },
        { value: 2.5, unit: "kg" },
      ],
    });

    const effectivePrefs = prefsForUnit(prefs, "kg");
    const out = planWorkoutLoads({
      maxWeight: 100,
      unit: "kg",
      prefs: effectivePrefs,
      percentages: [80, 80, 60],
      precision: 90,
    });

    expect(out.steps).toHaveLength(3);
    expect(out.steps[0]?.load.platesPerSide.map((p) => p.plate.value)).toEqual(
      out.steps[1]?.load.platesPerSide.map((p) => p.plate.value),
    );
    expect(out.steps[1]?.added).toHaveLength(0);
    expect(out.steps[1]?.removed).toHaveLength(0);
  });

  it("summarizes the rack across the whole sequence", () => {
    const prefs = makePrefs({
      bar: { value: 20, unit: "kg", label: "20 kg bar" },
      plates: [
        { value: 25, unit: "kg" },
        { value: 20, unit: "kg" },
        { value: 10, unit: "kg" },
        { value: 5, unit: "kg" },
        { value: 2.5, unit: "kg" },
      ],
    });

    const effectivePrefs = prefsForUnit(prefs, "kg");
    const out = planWorkoutLoads({
      maxWeight: 100,
      unit: "kg",
      prefs: effectivePrefs,
      percentages: [100, 50],
      precision: 100,
    });

    const maxCounts = new Map<string, number>();
    for (const step of out.steps) {
      const stepCounts = new Map<string, number>();
      for (const pick of step.load.platesPerSide) {
        const key = `${pick.plate.unit}:${pick.plate.value}`;
        stepCounts.set(key, (stepCounts.get(key) ?? 0) + 1);
      }
      for (const [key, count] of stepCounts) {
        maxCounts.set(key, Math.max(maxCounts.get(key) ?? 0, count));
      }
    }

    for (const [key, count] of maxCounts) {
      const [unit, rawValue] = key.split(":");
      const plate = out.rack.find(
        (item) => item.plate.unit === unit && String(item.plate.value) === rawValue,
      );
      expect(plate?.perSideCount).toBe(count);
      expect(plate?.totalCount).toBe(count * 2);
    }

    expect(out.totalSwaps).toBeGreaterThan(0);
  });
});
