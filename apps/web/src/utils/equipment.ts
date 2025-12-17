// apps/web/src/utils/equipment.ts
import type { Plate, Unit, UnitContext, UserPreferences } from "@repo/core";

function plate(value: number, unit: Unit, label?: string): Plate {
  return { value, unit, label: label ?? `${value} ${unit}` };
}

const DEFAULT_KG_PLATES: Plate[] = [
  plate(25, "kg"),
  plate(20, "kg"),
  plate(15, "kg"),
  plate(10, "kg"),
  plate(5, "kg"),
  plate(2.5, "kg"),
  plate(1.25, "kg"),
];

const DEFAULT_LB_PLATES_NO_5: Plate[] = [
  plate(45, "lb"),
  plate(35, "lb"),
  plate(25, "lb"),
  plate(15, "lb"),
  plate(10, "lb"),
];


type BarGender = "male" | "female";

function barValueFor(unit: Unit, gender: BarGender): number {
  if (unit === "lb") return gender === "male" ? 45 : 35;
  return gender === "male" ? 20 : 15;
}

function barLabelFor(unit: Unit, gender: BarGender): string {
  const v = barValueFor(unit, gender);
  return `${v} ${unit} bar`;
}

function inferGenderFromBar(bar: Plate | undefined): BarGender {
  if (!bar) return "male";
  if (bar.unit === "lb") return bar.value === 35 ? "female" : "male";
  return bar.value === 15 ? "female" : "male";
}

function isKgChangePlate(p: Plate) {
  return p.unit === "kg" && p.value > 0 && p.value <= 2.5;
}

function ensureContexts(prefs: UserPreferences): UserPreferences {
  // por si vienes de una DB vieja
  const contexts = prefs.contexts ?? { kg: "olympic", lb: "crossfit" };
  return { ...prefs, contexts };
}

function resolveBarForUnit(prefs: UserPreferences, unit: Unit): Plate {
  // Si ya hay barra en la unidad actual, se respeta tal cual.
  if (prefs.bar?.unit === unit) return prefs.bar;

  // Si la barra está guardada en la otra unidad, asumimos que representa el "gender"
  // y devolvemos la equivalente (15kg <-> 35lb, 20kg <-> 45lb).
  const gender = inferGenderFromBar(prefs.bar);
  const v = barValueFor(unit, gender);
  return plate(v, unit, barLabelFor(unit, gender));
}

export function prefsForUnit(
  base: UserPreferences,
  unit: Unit,
): UserPreferences {
  const prefs = ensureContexts(base);
  const context: UnitContext =
    prefs.contexts[unit] ?? (unit === "lb" ? "crossfit" : "olympic");

  const fromBase = prefs.plates ?? [];
  const bar = resolveBarForUnit(prefs, unit);

  if (unit === "kg") {
    if (context === "custom") {
      const kgPlates = fromBase.filter((p) => p.unit === "kg");
      return {
        ...prefs,
        bar,
        plates: kgPlates.length ? kgPlates : DEFAULT_KG_PLATES,
      };
    }

    // olympic (default) — plates default, barra según gender
    return { ...prefs, bar, plates: DEFAULT_KG_PLATES };
  }

  // units: lb
  if (context === "custom") {
    const lbPlates = fromBase.filter((p) => p.unit === "lb");
    const kgChanges = fromBase.filter(isKgChangePlate);

    const plates = (lbPlates.length ? lbPlates : DEFAULT_LB_PLATES_NO_5).concat(
      kgChanges,
    );

    return { ...prefs, bar, plates };
  }

  // crossfit (default) — plates default + kg change, barra según gender
  const lbPlates = DEFAULT_LB_PLATES_NO_5;
  const kgChanges = fromBase.filter(isKgChangePlate);
  return { ...prefs, bar, plates: lbPlates.concat(kgChanges) };
}
