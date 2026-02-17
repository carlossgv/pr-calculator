import { describe, expect, it } from "vitest";
import { nearestLoadableTotalUnlimited } from "./nearest-loadable";

describe("nearestLoadableTotalUnlimited", () => {
  it("returns bar value when target is invalid", () => {
    const out = nearestLoadableTotalUnlimited({
      targetTotal: -1,
      unit: "kg",
      bar: { value: 20, unit: "kg" },
      plates: [{ value: 2.5, unit: "kg" }],
    });

    expect(out.total).toBe(20);
    expect(Number.isNaN(out.delta)).toBe(true);
  });

  it("returns bar value when no plate denominations are available", () => {
    const out = nearestLoadableTotalUnlimited({
      targetTotal: 100,
      unit: "kg",
      bar: { value: 20, unit: "kg" },
      plates: [],
    });

    expect(out.total).toBe(20);
    expect(Number.isNaN(out.stepSide)).toBe(true);
  });

  it("rounds to nearest achievable total using smallest per-side plate", () => {
    const out = nearestLoadableTotalUnlimited({
      targetTotal: 101,
      unit: "kg",
      bar: { value: 20, unit: "kg" },
      plates: [
        { value: 20, unit: "kg" },
        { value: 2.5, unit: "kg" },
      ],
    });

    expect(out.stepSide).toBe(2.5);
    expect(out.stepTotal).toBe(5);
    expect(out.total).toBe(100);
    expect(out.delta).toBeCloseTo(1, 5);
  });
});
