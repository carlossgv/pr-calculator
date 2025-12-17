// packages/core/src/bar-math.ts
import type { Plate, Unit, UserPreferences } from "./types";
import { convertWeightValue } from "./units";

export type PlatePick = {
  plate: Plate;        // original (con label y unidad original)
  valueInUnit: number; // valor convertido a la unidad de trabajo
};

export type LoadResult = {
  unit: Unit;
  targetTotal: number;

  bar: PlatePick;      // bar convertido
  perSide: number;     // total por lado (placas) en unit
  platesPerSide: PlatePick[];

  achievedTotal: number;
  delta: number;
};

function roundTo(value: number, step: number) {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

export function calculateLoad(
  targetTotalInUnit: number,
  unit: Unit,
  prefs: UserPreferences
): LoadResult {
  const roundingInUnit = convertWeightValue(prefs.rounding.value, prefs.rounding.unit, unit);
  const roundedTarget = roundTo(targetTotalInUnit, roundingInUnit);

  const barInUnit = convertWeightValue(prefs.bar.value, prefs.bar.unit, unit);
  const targetPlatesTotal = Math.max(0, roundedTarget - barInUnit);
  const perSideTarget = targetPlatesTotal / 2;

  // Convertimos placas a “unidad de trabajo” pero mantenemos la referencia original
  const candidates: PlatePick[] = prefs.plates
    .map((p) => ({ plate: p, valueInUnit: convertWeightValue(p.value, p.unit, unit) }))
    .sort((a, b) => b.valueInUnit - a.valueInUnit);

  const platesPerSide: PlatePick[] = [];
  let remaining = perSideTarget;

  for (const c of candidates) {
    while (remaining + 1e-9 >= c.valueInUnit) {
      platesPerSide.push(c);
      remaining = +(remaining - c.valueInUnit).toFixed(5);
    }
  }

  const achievedPerSide = platesPerSide.reduce((s, p) => s + p.valueInUnit, 0);
  const achievedTotal = barInUnit + achievedPerSide * 2;

  return {
    unit,
    targetTotal: roundedTarget,
    bar: { plate: prefs.bar, valueInUnit: barInUnit },
    perSide: achievedPerSide,
    platesPerSide,
    achievedTotal,
    delta: +(achievedTotal - roundedTarget).toFixed(5),
  };
}
