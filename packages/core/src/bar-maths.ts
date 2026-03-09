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

const SEARCH_SCALE = 100;

function toScaled(value: number) {
  return Math.round(value * SEARCH_SCALE);
}

function findClosestPerSideLoad(
  perSideTarget: number,
  barInUnit: number,
  targetTotalInUnit: number,
  candidates: PlatePick[],
): PlatePick[] {
  if (perSideTarget <= 0 || candidates.length === 0) return [];

  const uniqueCandidates = candidates.filter(
    (candidate, index, all) =>
      all.findIndex((item) => item.valueInUnit === candidate.valueInUnit) === index,
  );

  const scaledBar = toScaled(barInUnit);
  const scaledTargetTotal = toScaled(targetTotalInUnit);
  const scaledTargetPerSide = Math.max(0, toScaled(perSideTarget));
  const scaledMinPlate = Math.min(
    ...uniqueCandidates.map((candidate) => toScaled(candidate.valueInUnit)),
  );
  const searchLimit = scaledTargetPerSide + scaledMinPlate;

  const reachable = new Array<boolean>(searchLimit + 1).fill(false);
  const previous = new Array<number>(searchLimit + 1).fill(-1);
  const previousPlate = new Array<number>(searchLimit + 1).fill(-1);

  reachable[0] = true;

  for (let current = 0; current <= searchLimit; current += 1) {
    if (!reachable[current]) continue;

    for (let plateIndex = 0; plateIndex < uniqueCandidates.length; plateIndex += 1) {
      const next = current + toScaled(uniqueCandidates[plateIndex].valueInUnit);
      if (next > searchLimit || reachable[next]) continue;
      reachable[next] = true;
      previous[next] = current;
      previousPlate[next] = plateIndex;
    }
  }

  let bestSum = 0;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (let sum = 0; sum <= searchLimit; sum += 1) {
    if (!reachable[sum]) continue;

    const achievedTotal = scaledBar + sum * 2;
    const delta = Math.abs(achievedTotal - scaledTargetTotal);

    if (delta < bestDelta || (delta === bestDelta && achievedTotal < scaledBar + bestSum * 2)) {
      bestSum = sum;
      bestDelta = delta;
    }
  }

  const platesPerSide: PlatePick[] = [];
  let cursor = bestSum;

  while (cursor > 0) {
    const plateIndex = previousPlate[cursor];
    if (plateIndex < 0) break;
    platesPerSide.push(uniqueCandidates[plateIndex]);
    cursor = previous[cursor];
  }

  return platesPerSide.sort((a, b) => b.valueInUnit - a.valueInUnit);
}

export function calculateLoad(
  targetTotalInUnit: number,
  unit: Unit,
  prefs: UserPreferences
): LoadResult {
  const barInUnit = convertWeightValue(prefs.bar.value, prefs.bar.unit, unit);
  const targetPlatesTotal = Math.max(0, targetTotalInUnit - barInUnit);
  const perSideTarget = targetPlatesTotal / 2;

  // Convertimos placas a “unidad de trabajo” pero mantenemos la referencia original
  const candidates: PlatePick[] = prefs.plates
    .map((p) => ({ plate: p, valueInUnit: convertWeightValue(p.value, p.unit, unit) }))
    .sort((a, b) => b.valueInUnit - a.valueInUnit);

  const platesPerSide = findClosestPerSideLoad(
    perSideTarget,
    barInUnit,
    targetTotalInUnit,
    candidates,
  );

  const achievedPerSide = platesPerSide.reduce((s, p) => s + p.valueInUnit, 0);
  const achievedTotal = barInUnit + achievedPerSide * 2;

  return {
    unit,
    targetTotal: +targetTotalInUnit.toFixed(5),
    bar: { plate: prefs.bar, valueInUnit: barInUnit },
    perSide: achievedPerSide,
    platesPerSide,
    achievedTotal,
    delta: +Math.abs(achievedTotal - targetTotalInUnit).toFixed(5),
  };
}
