import { convertWeightValue, type Plate, type Unit } from "@repo/core";

export type CountedPlate = { plate: Plate; count: number };

export function plateKey(plate: Plate) {
  return `${plate.unit}:${plate.value}`;
}

export function loadedBarTotal(bar: Plate, plates: CountedPlate[], unit: Unit) {
  const barValue = convertWeightValue(bar.value, bar.unit, unit);
  const oneSide = plates.reduce(
    (total, { plate, count }) =>
      total + convertWeightValue(plate.value, plate.unit, unit) * count,
    0,
  );
  return barValue + 2 * oneSide;
}

export function displayedLoadedBarTotal(bar: Plate, plates: CountedPlate[], unit: Unit) {
  return Math.round((loadedBarTotal(bar, plates, unit) + Number.EPSILON) * 10) / 10;
}
