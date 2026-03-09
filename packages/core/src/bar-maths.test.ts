import { describe, expect, it } from "vitest";
import { calculateLoad } from "./bar-maths";
import { DEFAULT_PREFS } from "./defaults";
import type { UserPreferences } from "./types";

function makePrefs(partial?: Partial<UserPreferences>): UserPreferences {
  return { ...DEFAULT_PREFS, ...partial };
}

describe("calculateLoad", () => {
  it("returns exact achievable load when possible", () => {
    const prefs = makePrefs({
      bar: { value: 20, unit: "kg", label: "20 kg" },
      rounding: { value: 2.5, unit: "kg" },
      plates: [{ value: 20, unit: "kg" }],
    });

    const out = calculateLoad(101, "kg", prefs);
    expect(out.targetTotal).toBe(101);
    expect(out.achievedTotal).toBe(100);
    expect(out.delta).toBe(1);
    expect(out.platesPerSide).toHaveLength(2);
  });

  it("handles targets below bar weight with zero plates", () => {
    const prefs = makePrefs({
      bar: { value: 20, unit: "kg", label: "20 kg" },
      plates: [{ value: 25, unit: "kg" }],
    });

    const out = calculateLoad(10, "kg", prefs);
    expect(out.platesPerSide).toHaveLength(0);
    expect(out.achievedTotal).toBeCloseTo(20, 5);
    expect(out.delta).toBeGreaterThan(0);
  });

  it("finds the closest achievable load instead of using a greedy overshoot-prone pick", () => {
    const prefs = makePrefs({
      bar: { value: 15, unit: "kg", label: "15 kg" },
      rounding: { value: 2.5, unit: "kg" },
      plates: [
        { value: 2.5, unit: "kg" },
        { value: 2, unit: "kg" },
      ],
    });

    const out = calculateLoad(48.8, "kg", prefs);
    expect(out.achievedTotal).toBe(49);
    expect(out.delta).toBeCloseTo(0.2, 5);
    expect(out.perSide).toBe(17);
    expect(out.platesPerSide.every((plate) => [2, 2.5].includes(plate.plate.value))).toBe(true);
    expect(out.platesPerSide.some((plate) => plate.plate.value === 2)).toBe(true);
  });

  it("supports mixed plate units when working in lb", () => {
    const prefs = makePrefs({
      bar: { value: 20, unit: "kg", label: "20 kg" },
      plates: [
        { value: 45, unit: "lb" },
        { value: 2.5, unit: "kg" },
      ],
    });

    const out = calculateLoad(225, "lb", prefs);
    expect(out.unit).toBe("lb");
    expect(out.achievedTotal).toBeLessThanOrEqual(out.targetTotal + 0.001);
    expect(out.platesPerSide.length).toBeGreaterThan(0);
  });
});
