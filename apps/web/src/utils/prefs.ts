// apps/web/src/utils/prefs.ts
import type { Unit, UserPreferences } from "@repo/core";
import { convertWeight } from "@repo/core";

export function prefsToUnit(
  prefs: UserPreferences,
  unit: Unit,
): UserPreferences {
  if (prefs.unit === unit) return prefs;

  return {
    unit,
    barWeight: convertWeight(prefs.barWeight, prefs.unit, unit),
    rounding: convertWeight(prefs.rounding, prefs.unit, unit),
    plates: prefs.plates.map((p) => convertWeight(p, prefs.unit, unit)),
  };
}
