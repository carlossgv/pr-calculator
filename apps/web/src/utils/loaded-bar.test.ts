import { describe, expect, it } from "vitest";
import { displayedLoadedBarTotal, loadedBarTotal } from "./loaded-bar";

describe("loadedBarTotal", () => {
  it("returns the selected bar weight without plates", () => {
    expect(loadedBarTotal({ value: 20, unit: "kg" }, [], "kg")).toBe(20);
  });

  it("counts every plate on both sides", () => {
    expect(
      loadedBarTotal(
        { value: 20, unit: "kg" },
        [{ plate: { value: 25, unit: "kg" }, count: 2 }],
        "kg",
      ),
    ).toBe(120);
  });

  it("adds 25 kg and 15 kg per side to a 20 kg bar", () => {
    expect(
      loadedBarTotal(
        { value: 20, unit: "kg" },
        [
          { plate: { value: 25, unit: "kg" }, count: 1 },
          { plate: { value: 15, unit: "kg" }, count: 1 },
        ],
        "kg",
      ),
    ).toBe(100);
  });

  it("converts mixed units before rounding the displayed result", () => {
    const bar = { value: 45, unit: "lb" } as const;
    const plates = [
      { plate: { value: 25, unit: "lb" } as const, count: 1 },
      { plate: { value: 2.5, unit: "kg" } as const, count: 1 },
    ];
    expect(loadedBarTotal(bar, plates, "lb")).toBeCloseTo(106.0231, 3);
    expect(displayedLoadedBarTotal(bar, plates, "lb")).toBe(106);
    expect(displayedLoadedBarTotal(bar, plates, "kg")).toBe(48.1);
  });
});
