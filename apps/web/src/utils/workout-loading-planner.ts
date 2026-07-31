import {
  calculateLoad,
  type LoadResult,
  type PlatePick,
  type Unit,
  type UserPreferences,
} from "@repo/core";

export const MIN_PLANNER_PERCENT = 0.1;
export const MAX_PLANNER_PERCENT = 300;

export type PlannerRow = {
  percentage: number;
  targetWeight: number;
  achievedWeight: number;
  signedDelta: number;
  load: LoadResult;
};

export type PlateQuantity = {
  key: string;
  pick: PlatePick;
  count: number;
};

export type PlateTransition = {
  add: PlateQuantity[];
  remove: PlateQuantity[];
  unchanged: boolean;
};

export function buildPlannerPath(
  unit: Unit,
  weight: number,
  context?: { movementId?: string; returnTo?: string },
) {
  const query = new URLSearchParams();
  if (context?.movementId) query.set("movementId", context.movementId);
  if (context?.returnTo) query.set("returnTo", context.returnTo);
  const suffix = query.size ? `?${query.toString()}` : "";
  return `/planner/${unit}/${weight}${suffix}`;
}

function round(value: number, decimals = 5) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function normalizePlannerPercentage(value: unknown): number | null {
  const parsed = Number(String(value).replace("%", "").replace(",", ".").trim());
  if (!Number.isFinite(parsed)) return null;

  const normalized = round(parsed, 1);
  if (normalized < MIN_PLANNER_PERCENT || normalized > MAX_PLANNER_PERCENT) {
    return null;
  }

  return normalized;
}

export function addPlannerPercentage(
  percentages: number[],
  value: unknown,
): number[] | null {
  const normalized = normalizePlannerPercentage(value);
  if (normalized == null) return null;
  if (percentages.some((percentage) => Math.abs(percentage - normalized) < 0.0001)) {
    return null;
  }

  return [...percentages, normalized];
}

export function movePlannerPercentage(
  percentages: number[],
  index: number,
  direction: -1 | 1,
) {
  const target = index + direction;
  if (index < 0 || index >= percentages.length || target < 0 || target >= percentages.length) {
    return percentages;
  }

  const next = [...percentages];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function buildPlannerRows(
  maxWeight: number,
  percentages: number[],
  unit: Unit,
  prefs: UserPreferences,
): PlannerRow[] {
  const safeWeight = Number.isFinite(maxWeight) && maxWeight >= 0 ? maxWeight : 0;

  return percentages.map((percentage) => {
    const targetWeight = round((safeWeight * percentage) / 100);
    const load = calculateLoad(targetWeight, unit, prefs);
    return {
      percentage,
      targetWeight,
      achievedWeight: load.achievedTotal,
      signedDelta: round(load.achievedTotal - targetWeight),
      load,
    };
  });
}

export function plateIdentity(pick: PlatePick) {
  return `${pick.plate.unit}:${pick.plate.value}`;
}

function countPlates(plates: PlatePick[]) {
  const counts = new Map<string, PlateQuantity>();

  for (const pick of plates) {
    const key = plateIdentity(pick);
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { key, pick, count: 1 });
  }

  return counts;
}

function sortPlateQuantities(quantities: PlateQuantity[]) {
  return quantities.sort((a, b) => b.pick.valueInUnit - a.pick.valueInUnit);
}

export function derivePlateTransition(
  current: PlatePick[],
  next: PlatePick[],
): PlateTransition {
  const currentCounts = countPlates(current);
  const nextCounts = countPlates(next);
  const add: PlateQuantity[] = [];
  const remove: PlateQuantity[] = [];
  const keys = new Set([...currentCounts.keys(), ...nextCounts.keys()]);

  for (const key of keys) {
    const currentQuantity = currentCounts.get(key);
    const nextQuantity = nextCounts.get(key);
    const difference = (nextQuantity?.count ?? 0) - (currentQuantity?.count ?? 0);
    if (difference > 0 && nextQuantity) {
      add.push({ ...nextQuantity, count: difference });
    } else if (difference < 0 && currentQuantity) {
      remove.push({ ...currentQuantity, count: Math.abs(difference) });
    }
  }

  sortPlateQuantities(add);
  sortPlateQuantities(remove);
  return { add, remove, unchanged: add.length === 0 && remove.length === 0 };
}

export function deriveSequentialInventory(rows: PlannerRow[]): PlateQuantity[] {
  const maximums = new Map<string, PlateQuantity>();

  for (const row of rows) {
    for (const quantity of countPlates(row.load.platesPerSide).values()) {
      const existing = maximums.get(quantity.key);
      if (!existing || quantity.count > existing.count) {
        maximums.set(quantity.key, { ...quantity });
      }
    }
  }

  return sortPlateQuantities(
    [...maximums.values()].map((quantity) => ({
      ...quantity,
      count: quantity.count * 2,
    })),
  );
}
