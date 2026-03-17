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

  it("prefers a practical lb setup over a tiny-plate-heavy exact-ish match", () => {
    const prefs = makePrefs({
      bar: { value: 45, unit: "lb", label: "45 lb bar" },
      plates: [
        { value: 45, unit: "lb" },
        { value: 35, unit: "lb" },
        { value: 25, unit: "lb" },
        { value: 15, unit: "lb" },
        { value: 10, unit: "lb" },
        { value: 2.5, unit: "kg", label: "2.5 kg" },
        { value: 2, unit: "kg", label: "2 kg" },
        { value: 1.5, unit: "kg", label: "1.5 kg" },
        { value: 1, unit: "kg", label: "1 kg" },
        { value: 0.5, unit: "kg", label: "0.5 kg" },
      ],
    });

    const out = calculateLoad(172, "lb", prefs);
    expect(out.platesPerSide.length).toBeLessThanOrEqual(3);
    expect(out.platesPerSide.filter((plate) => plate.plate.unit === "kg")).toHaveLength(1);
    expect(out.platesPerSide.some((plate) => plate.plate.value === 45)).toBe(true);
    expect(out.platesPerSide.some((plate) => plate.plate.value === 15)).toBe(true);
    expect(out.platesPerSide.some((plate) => plate.plate.value === 1.5)).toBe(true);
  });

  it("prefers a practical kg setup when tiny change plates are available", () => {
    const prefs = makePrefs({
      bar: { value: 20, unit: "kg", label: "20 kg bar" },
      plates: [
        { value: 25, unit: "kg" },
        { value: 20, unit: "kg" },
        { value: 15, unit: "kg" },
        { value: 10, unit: "kg" },
        { value: 5, unit: "kg" },
        { value: 2.5, unit: "kg" },
        { value: 2, unit: "kg" },
        { value: 1.5, unit: "kg" },
        { value: 1, unit: "kg" },
        { value: 0.5, unit: "kg" },
      ],
    });

    const out = calculateLoad(83.2, "kg", prefs);
    expect(out.platesPerSide).toHaveLength(3);
    expect(out.platesPerSide.some((plate) => plate.plate.value === 25)).toBe(true);
    expect(out.platesPerSide.some((plate) => plate.plate.value === 5)).toBe(true);
    expect(out.platesPerSide.some((plate) => plate.plate.value === 1.5)).toBe(true);
  });

  it("keeps pure lb setups simple when no kg change plates exist", () => {
    const prefs = makePrefs({
      bar: { value: 45, unit: "lb", label: "45 lb bar" },
      plates: [
        { value: 45, unit: "lb" },
        { value: 35, unit: "lb" },
        { value: 25, unit: "lb" },
        { value: 15, unit: "lb" },
        { value: 10, unit: "lb" },
      ],
    });

    const out = calculateLoad(137, "lb", prefs);
    expect(out.platesPerSide).toHaveLength(1);
    expect(out.platesPerSide[0]?.plate.value).toBe(45);
    expect(out.achievedTotal).toBe(135);
  });

  it("uses a small kg change plate in lb mode when it avoids a larger practical miss", () => {
    const prefs = makePrefs({
      bar: { value: 45, unit: "lb", label: "45 lb bar" },
      plates: [
        { value: 45, unit: "lb" },
        { value: 35, unit: "lb" },
        { value: 25, unit: "lb" },
        { value: 15, unit: "lb" },
        { value: 10, unit: "lb" },
        { value: 2.5, unit: "kg", label: "2.5 kg" },
        { value: 2, unit: "kg", label: "2 kg" },
        { value: 1.5, unit: "kg", label: "1.5 kg" },
        { value: 1, unit: "kg", label: "1 kg" },
        { value: 0.5, unit: "kg", label: "0.5 kg" },
      ],
    });

    const out = calculateLoad(187, "lb", prefs);
    expect(out.platesPerSide).toHaveLength(3);
    expect(out.platesPerSide.some((plate) => plate.plate.value === 45)).toBe(true);
    expect(out.platesPerSide.some((plate) => plate.plate.value === 25)).toBe(true);
    expect(out.platesPerSide.some((plate) => plate.plate.value === 0.5)).toBe(true);
  });
});
