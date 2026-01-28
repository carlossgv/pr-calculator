// packages/core/src/defaults.ts
import type { Plate, UserPreferences } from "./types";

function plate(value: number, unit: "kg" | "lb", label?: string): Plate {
  return { value, unit, label: label ?? `${value} ${unit}` };
}

export const DEFAULT_PREFS: UserPreferences = {
  language: "es", // ✅ NEW
  defaultUnit: "kg",
  contexts: { kg: "olympic", lb: "crossfit" },
  theme: "dark",
  bar: plate(20, "kg", "20 kg bar"),
  rounding: { value: 2.5, unit: "kg" },
  plates: [
    plate(25, "kg"),
    plate(20, "kg"),
    plate(15, "kg"),
    plate(10, "kg"),
    plate(5, "kg"),
    plate(2.5, "kg"),
    plate(2, "kg"),
    plate(1.5, "kg"),
    plate(1, "kg"),
    plate(0.5, "kg"),
  ],
};

export const CROSSFIT_LB_WITH_KG_CHANGES: UserPreferences = {
  language: "es", // ✅ NEW (hereda si quieres, pero en defaults conviene explícito)
  defaultUnit: "lb",
  contexts: { kg: "olympic", lb: "crossfit" },
  theme: "dark",
  bar: plate(45, "lb", "45 lb bar"),
  rounding: { value: 1, unit: "lb" },
  plates: [
    plate(45, "lb"),
    plate(35, "lb"),
    plate(25, "lb"),
    plate(15, "lb"),
    plate(10, "lb"),
    plate(2.5, "kg", "2.5 kg"),
    plate(2, "kg", "2 kg"),
    plate(1.5, "kg", "1.5 kg"),
    plate(1, "kg", "1 kg"),
    plate(0.5, "kg", "0.5 kg"),
  ],
};
