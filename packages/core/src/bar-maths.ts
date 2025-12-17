
import type { UserPreferences } from "./types";

export type LoadResult = {
  targetTotal: number;
  barWeight: number;
  perSide: number;
  platesPerSide: number[];
  achievedTotal: number;
  delta: number; // achieved - target (0 ideal)
};

function roundTo(value: number, step: number) {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

/**
 * Calcula la carga por lado usando estrategia greedy (placas grandes primero).
 * Para CrossFit / gimnasios suele ser suficiente y súper estable.
 */
export function calculateLoad(
  targetTotal: number,
  prefs: UserPreferences
): LoadResult {
  const roundedTarget = roundTo(targetTotal, prefs.rounding);

  const targetPlatesTotal = Math.max(0, roundedTarget - prefs.barWeight);
  const perSideTarget = targetPlatesTotal / 2;

  const platesSorted = [...prefs.plates].sort((a, b) => b - a);

  const platesPerSide: number[] = [];
  let remaining = perSideTarget;

  for (const p of platesSorted) {
    while (remaining + 1e-9 >= p) {
      platesPerSide.push(p);
      remaining = +(remaining - p).toFixed(5);
    }
  }

  const achievedPerSide = platesPerSide.reduce((s, n) => s + n, 0);
  const achievedTotal = prefs.barWeight + achievedPerSide * 2;

  return {
    targetTotal: roundedTarget,
    barWeight: prefs.barWeight,
    perSide: achievedPerSide,
    platesPerSide,
    achievedTotal,
    delta: +(achievedTotal - roundedTarget).toFixed(5),
  };
}
