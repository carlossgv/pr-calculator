// packages/core/src/units.ts
import type { Unit, Weight } from "./types";

const KG_TO_LB = 2.2046226218;

export function convertWeightValue(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  if (from === "kg" && to === "lb") return value * KG_TO_LB;
  return value / KG_TO_LB;
}

export function convertWeight(w: Weight, to: Unit): Weight {
  return { value: convertWeightValue(w.value, w.unit, to), unit: to };
}
