
// apps/web/src/utils/equipment.ts
import type { Plate, Unit, UserPreferences } from "@repo/core";

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

// En LB, permitimos change plates en KG hasta 2.5kg
function isKgChangePlate(p: Plate) {
  return p.unit === "kg" && p.value > 0 && p.value <= 2.5;
}

export function prefsForUnit(base: UserPreferences, unit: Unit): UserPreferences {
  // 1) Bar coherente con el contexto
  const bar = unit === "lb" ? DEFAULT_LB_BAR : DEFAULT_KG_BAR;

  // 2) Plates coherentes con el contexto
  const fromBase = base.plates ?? [];

  if (unit === "lb") {
    const lbPlates = fromBase.filter((p) => p.unit === "lb");
    const kgChanges = fromBase.filter(isKgChangePlate);

    // Si no hay LB plates en prefs (venías de olympic kg), usamos el set CF por defecto
    const plates = (lbPlates.length > 0 ? lbPlates : DEFAULT_LB_PLATES_NO_5).concat(kgChanges);

    return {
      ...base,
      defaultUnit: base.defaultUnit,
      bar,
      plates,
      // rounding lo dejamos tal cual venga; se interpreta en core con conversión.
      rounding: base.rounding,
    };
  }

  // unit === "kg"
  const kgPlates = fromBase.filter((p) => p.unit === "kg");
  const plates = kgPlates.length > 0 ? kgPlates : DEFAULT_KG_PLATES;

  return {
    ...base,
    defaultUnit: base.defaultUnit,
    bar,
    plates,
    rounding: base.rounding,
  };
}
