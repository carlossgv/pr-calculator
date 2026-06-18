import { calculateLoad, type LoadResult, type PlatePick, type Unit, type UserPreferences } from "@repo/core";

export type WorkoutPlannerChange = {
  plate: PlatePick["plate"];
  count: number;
};

export type WorkoutPlannerStep = {
  index: number;
  pct: number;
  target: number;
  load: LoadResult;
  delta: number;
  added: WorkoutPlannerChange[];
  removed: WorkoutPlannerChange[];
  repeated: boolean;
};

export type WorkoutPlannerRackItem = {
  plate: PlatePick["plate"];
  perSideCount: number;
  totalCount: number;
};

export type WorkoutPlannerResult = {
  steps: WorkoutPlannerStep[];
  rack: WorkoutPlannerRackItem[];
  totalSwaps: number;
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function loadSignature(load: LoadResult) {
  return load.platesPerSide
    .map((p) => `${p.plate.unit}:${p.plate.value}:${round1(p.valueInUnit)}`)
    .sort()
    .join("|");
}

function plateKey(plate: PlatePick["plate"]) {
  return `${plate.unit}:${plate.value}`;
}

function countPlates(load: LoadResult) {
  const counts = new Map<string, { plate: PlatePick["plate"]; count: number }>();
  for (const pick of load.platesPerSide) {
    const key = plateKey(pick.plate);
    const prev = counts.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      counts.set(key, { plate: pick.plate, count: 1 });
    }
  }
  return counts;
}

function diffLoads(from: LoadResult | null, to: LoadResult) {
  const fromCounts = from ? countPlates(from) : new Map<string, { plate: PlatePick["plate"]; count: number }>();
  const toCounts = countPlates(to);
  const allKeys = new Set([...fromCounts.keys(), ...toCounts.keys()]);
  const added: WorkoutPlannerChange[] = [];
  const removed: WorkoutPlannerChange[] = [];

  for (const key of allKeys) {
    const prev = fromCounts.get(key)?.count ?? 0;
    const next = toCounts.get(key)?.count ?? 0;
    const delta = next - prev;
    if (delta > 0) {
      added.push({ plate: toCounts.get(key)!.plate, count: delta });
    } else if (delta < 0) {
      removed.push({ plate: fromCounts.get(key)!.plate, count: Math.abs(delta) });
    }
  }

  const sortDesc = (a: WorkoutPlannerChange, b: WorkoutPlannerChange) => {
    const av = a.plate.unit === "kg" ? a.plate.value : a.plate.value;
    const bv = b.plate.unit === "kg" ? b.plate.value : b.plate.value;
    return bv - av;
  };

  return {
    added: added.sort(sortDesc),
    removed: removed.sort(sortDesc),
    swaps:
      [...added, ...removed].reduce((sum, item) => sum + item.count, 0),
  };
}

function uniqueSortedCandidates(loads: LoadResult[]) {
  const seen = new Set<string>();
  const out: LoadResult[] = [];
  for (const load of loads) {
    const sig = loadSignature(load);
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(load);
  }
  return out;
}

function smallestPlateStep(unit: Unit, prefs: UserPreferences) {
  const converted = prefs.plates
    .map((plate) => {
      if (plate.value <= 0) return NaN;
      if (plate.unit === unit) return plate.value;
      // local copy to avoid importing the whole unit helper again
      const kgToLb = 2.2046226218;
      return unit === "lb" ? plate.value * kgToLb : plate.value / kgToLb;
    })
    .filter((n) => Number.isFinite(n) && n > 0);

  if (!converted.length) return unit === "lb" ? 2.5 : 0.5;
  return Math.min(...converted);
}

function candidateTargets(rawTarget: number, unit: Unit, prefs: UserPreferences, precision: number) {
  const stepBase = smallestPlateStep(unit, prefs);
  const normalized = clamp(precision, 0, 100) / 100;
  const stepMultiplier = 2 - normalized * 1.5;
  const step = Math.max(stepBase * stepMultiplier, stepBase / 4);
  const window = Math.max(1, Math.round(1 + (1 - normalized) * 4));
  const candidates: number[] = [];

  for (let i = -window; i <= window; i += 1) {
    const next = round1(rawTarget + i * step);
    if (next > 0) candidates.push(next);
  }

  candidates.push(round1(rawTarget));
  return [...new Set(candidates)].sort((a, b) => a - b);
}

function precisionWeights(precision: number) {
  const t = clamp(precision, 0, 100) / 100;
  const accuracy = 0.8 + t * 4.2;
  const transition = 1.2 + (1 - t) * 3.2;
  const simplicity = 0.8 + (1 - t) * 2.1;

  return {
    transition,
    simplicity,
    accuracy,
  };
}

function pickLoadForTarget(args: {
  rawTarget: number;
  unit: Unit;
  prefs: UserPreferences;
  precision: number;
  prevLoad: LoadResult | null;
}) {
  const { rawTarget, unit, prefs, precision, prevLoad } = args;
  const candidates = uniqueSortedCandidates(
    candidateTargets(rawTarget, unit, prefs, precision).map((target) =>
      calculateLoad(target, unit, prefs),
    ),
  );

  const weights = precisionWeights(precision);
  let best = candidates[0] ?? calculateLoad(rawTarget, unit, prefs);
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const transition = diffLoads(prevLoad, candidate).swaps;
    const plateCount = candidate.platesPerSide.length;
    const delta = Math.abs(candidate.achievedTotal - rawTarget);
    const typeCount = new Set(
      candidate.platesPerSide.map((p) => plateKey(p.plate)),
    ).size;

    const score =
      transition * weights.transition +
      (plateCount + typeCount * 0.5) * weights.simplicity +
      delta * weights.accuracy;

    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

export function planWorkoutLoads(args: {
  maxWeight: number;
  unit: Unit;
  prefs: UserPreferences;
  percentages: number[];
  precision: number;
}): WorkoutPlannerResult {
  const { maxWeight, unit, prefs, percentages, precision } = args;
  const sequence = percentages
    .map((pct) => Math.round(Number(pct) * 10) / 10)
    .filter((pct) => Number.isFinite(pct) && pct > 0 && pct <= 300);

  const chosenByPct = new Map<number, LoadResult>();
  const steps: WorkoutPlannerStep[] = [];
  let prevLoad: LoadResult | null = null;

  sequence.forEach((pct, index) => {
    const rawTarget = round1((maxWeight * pct) / 100);
    let load = chosenByPct.get(pct) ?? null;
    let repeated = false;

    if (!load) {
      load = pickLoadForTarget({
        rawTarget,
        unit,
        prefs,
        precision,
        prevLoad,
      });
      chosenByPct.set(pct, load);
    } else {
      repeated = true;
    }

    const change = diffLoads(prevLoad, load);
    steps.push({
      index,
      pct,
      target: rawTarget,
      load,
      delta: round1(load.delta),
      added: change.added,
      removed: change.removed,
      repeated,
    });

    prevLoad = load;
  });

  const rackCounts = new Map<
    string,
    { plate: PlatePick["plate"]; perSideCount: number }
  >();

  for (const step of steps) {
    for (const pick of step.load.platesPerSide) {
      const key = plateKey(pick.plate);
      const current = rackCounts.get(key);
      if (!current || current.perSideCount < 1) {
        rackCounts.set(key, { plate: pick.plate, perSideCount: 1 });
      }
      const nextCount = Math.max(
        rackCounts.get(key)?.perSideCount ?? 0,
        countPlates(step.load).get(key)?.count ?? 0,
      );
      rackCounts.set(key, { plate: pick.plate, perSideCount: nextCount });
    }
  }

  const rack = [...rackCounts.values()]
    .map((item) => ({
      plate: item.plate,
      perSideCount: item.perSideCount,
      totalCount: item.perSideCount * 2,
    }))
    .sort((a, b) => {
      const av = a.plate.value;
      const bv = b.plate.value;
      if (a.plate.unit !== b.plate.unit) return a.plate.unit === unit ? -1 : 1;
      return bv - av;
    });

  const totalSwaps = steps.reduce((sum, step) => {
    const change = diffLoads(
      step.index > 0 ? steps[step.index - 1].load : null,
      step.load,
    );
    return sum + change.swaps;
  }, 0);

  return { steps, rack, totalSwaps };
}
