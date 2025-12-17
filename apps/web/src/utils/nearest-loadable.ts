// apps/web/src/utils/nearest-loadable.ts
import type { Plate, Unit } from "@repo/core";
import { convertWeightValue } from "@repo/core";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/**
 * Rounding "nearest plates" as: nearest achievable total assuming UNLIMITED plates
 * of the provided denominations.
 *
 * Strategy:
 * - Convert bar + all plates to current unit
 * - Find smallest plate value per side => stepSide
 * - Compute sideTarget = (targetTotal - bar)/2
 * - Round sideTarget to nearest multiple of stepSide
 * - total = bar + 2*roundedSide
 */
export function nearestLoadableTotalUnlimited(args: {
  targetTotal: number;
  unit: Unit; // the display unit
  bar: Plate;
  plates: Plate[];
}): { total: number; delta: number; stepTotal: number; stepSide: number } {
  const { targetTotal, unit, bar, plates } = args;

  const barValue = convertWeightValue(bar.value, bar.unit, unit);

  const denom = plates
    .map((p) => convertWeightValue(p.value, p.unit, unit))
    .filter((v) => Number.isFinite(v) && v > 0);

  if (!Number.isFinite(targetTotal) || targetTotal <= 0) {
    return { total: round1(barValue), delta: NaN, stepTotal: NaN, stepSide: NaN };
  }

  if (denom.length === 0) {
    const total = round1(barValue);
    return { total, delta: Math.abs(total - targetTotal), stepTotal: NaN, stepSide: NaN };
  }

  const stepSide = Math.min(...denom);
  const stepTotal = 2 * stepSide;

  const sideTarget = Math.max(0, (targetTotal - barValue) / 2);
  const roundedSide = Math.max(0, Math.round(sideTarget / stepSide) * stepSide);

  const total = round1(barValue + 2 * roundedSide);
  return { total, delta: Math.abs(total - targetTotal), stepTotal, stepSide };
}
