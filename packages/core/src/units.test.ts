import { describe, expect, it } from "vitest";
import { convertWeight, convertWeightValue } from "./units";

describe("convertWeightValue", () => {
  it("returns same value for same unit", () => {
    expect(convertWeightValue(100, "kg", "kg")).toBe(100);
  });

  it("converts kg to lb", () => {
    expect(convertWeightValue(20, "kg", "lb")).toBeCloseTo(44.09245, 4);
  });

  it("converts lb to kg", () => {
    expect(convertWeightValue(45, "lb", "kg")).toBeCloseTo(20.41166, 4);
  });
});

describe("convertWeight", () => {
  it("converts weight object preserving target unit", () => {
    const out = convertWeight({ value: 10, unit: "kg" }, "lb");
    expect(out.unit).toBe("lb");
    expect(out.value).toBeCloseTo(22.0462, 4);
  });
});
