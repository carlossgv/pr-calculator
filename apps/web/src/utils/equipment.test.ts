import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, type UserPreferences } from "@repo/core";
import { prefsForUnit } from "./equipment";

function withPrefs(partial?: Partial<UserPreferences>): UserPreferences {
  return { ...DEFAULT_PREFS, ...partial };
}

describe("prefsForUnit", () => {
  it("maps female lb bar to equivalent kg bar", () => {
    const prefs = withPrefs({
      bar: { value: 35, unit: "lb", label: "35 lb bar" },
      contexts: { kg: "olympic", lb: "crossfit" },
    });

    const out = prefsForUnit(prefs, "kg");
    expect(out.bar.unit).toBe("kg");
    expect(out.bar.value).toBe(15);
  });

  it("returns lb custom plates plus kg change plates", () => {
    const prefs = withPrefs({
      bar: { value: 45, unit: "lb", label: "45 lb bar" },
      contexts: { kg: "olympic", lb: "custom" },
      plates: [
        { value: 45, unit: "lb" },
        { value: 25, unit: "lb" },
        { value: 2.5, unit: "kg" },
        { value: 5, unit: "kg" },
      ],
    });

    const out = prefsForUnit(prefs, "lb");
    expect(out.plates.some((p) => p.unit === "lb" && p.value === 45)).toBe(true);
    expect(out.plates.some((p) => p.unit === "kg" && p.value === 2.5)).toBe(true);
    expect(out.plates.some((p) => p.unit === "kg" && p.value === 5)).toBe(false);
  });
});
