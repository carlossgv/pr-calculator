// apps/web/src/utils/equipment.ts
import type { Plate, Unit, UnitContext, UserPreferences } from "@repo/core";

function plate(value: number, unit: Unit, label?: string): Plate {
  return { value, unit, label: label ?? `${value} ${unit}` };
}

const DEFAULT_KG_PLATES: Plate[] = [
  plate(25, "kg"), plate(20, "kg"), plate(15, "kg"), plate(10, "kg"),
  plate(5, "kg"), plate(2.5, "kg"), plate(1.25, "kg"),
];

const DEFAULT_LB_PLATES_NO_5: Plate[] = [
  plate(45, "lb"), plate(35, "lb"), plate(25, "lb"), plate(15, "lb"), plate(10, "lb"),
];

const DEFAULT_KG_BAR = plate(20, "kg", "20 kg bar");
const DEFAULT_LB_BAR = plate(45, "lb", "45 lb bar");

function isKgChangePlate(p: Plate) {
  return p.unit === "kg" && p.value > 0 && p.value <= 2.5;
}

function ensureContexts(prefs: UserPreferences): UserPreferences {
  // por si vienes de una DB vieja
  const contexts = prefs.contexts ?? { kg: "olympic", lb: "crossfit" };
  return { ...prefs, contexts };
}

export function prefsForUnit(base: UserPreferences, unit: Unit): UserPreferences {
  const prefs = ensureContexts(base);
  const context: UnitContext = prefs.contexts[unit] ?? (unit === "lb" ? "crossfit" : "olympic");

  const fromBase = prefs.plates ?? [];

  if (unit === "kg") {
    if (context === "custom") {
      const kgPlates = fromBase.filter((p) => p.unit === "kg");
      const bar = prefs.bar.unit === "kg" ? prefs.bar : DEFAULT_KG_BAR;
      return { ...prefs, bar, plates: kgPlates.length ? kgPlates : DEFAULT_KG_PLATES };
    }

    // olympic (default)
    return { ...prefs, bar: DEFAULT_KG_BAR, plates: DEFAULT_KG_PLATES };
  }

  // units: lb
  if (context === "custom") {
    const lbPlates = fromBase.filter((p) => p.unit === "lb");
    const kgChanges = fromBase.filter(isKgChangePlate);
    const bar = prefs.bar.unit === "lb" ? prefs.bar : DEFAULT_LB_BAR;

    const plates = (lbPlates.length ? lbPlates : DEFAULT_LB_PLATES_NO_5).concat(kgChanges);
    return { ...prefs, bar, plates };
  }

  // crossfit (default)
  const lbPlates = DEFAULT_LB_PLATES_NO_5;
  const kgChanges = fromBase.filter(isKgChangePlate);
  return { ...prefs, bar: DEFAULT_LB_BAR, plates: lbPlates.concat(kgChanges) };
}
