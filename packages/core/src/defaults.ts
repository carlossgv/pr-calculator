// packages/core/src/defaults.ts
import type { Plate, UserPreferences } from "./types";

function plate(value: number, unit: "kg" | "lb", label?: string): Plate {
  return { value, unit, label: label ?? `${value} ${unit}` };
}

export const DEFAULT_PREFS: UserPreferences = {
  defaultUnit: "kg",
  bar: plate(20, "kg", "20 kg bar"),
  rounding: { value: 2.5, unit: "kg" },
  plates: [
    plate(25, "kg"),
    plate(20, "kg"),
    plate(15, "kg"),
    plate(10, "kg"),
    plate(5, "kg"),
    plate(2.5, "kg"),
    plate(1.25, "kg"),
  ],
};

// CrossFit LB plates + KG change plates (por lado)
export const CROSSFIT_LB_WITH_KG_CHANGES: UserPreferences = {
  defaultUnit: "lb",
  bar: plate(45, "lb", "45 lb bar"),
  // En tu box: mínimo LB es 10, pero sí hay changes KG.
  // El step real lo define el par más pequeño disponible.
  // Aquí lo dejamos “amigable” en 1 lb (ajustable en UI).
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
  ],
};
