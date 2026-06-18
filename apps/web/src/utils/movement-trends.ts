import type { PrEntry, Unit } from "@repo/core";
import { estimate1rmEpley } from "./1rm";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function formatDate(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);

  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return iso.slice(0, 10);
  }
}

function sortEntries(entries: PrEntry[]) {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.updatedAt !== b.updatedAt) return a.updatedAt.localeCompare(b.updatedAt);
    return a.id.localeCompare(b.id);
  });
}

export type MovementTrendPoint = {
  id: string;
  date: string;
  label: string;
  weight: number;
  reps: number;
  estimated1rm: number | null;
  deltaFromPrevious: number | null;
};

export type MovementTrendSummary = {
  entryCount: number;
  firstDate: string | null;
  latestDate: string | null;
  bestWeight: {
    weight: number;
    reps: number;
    date: string;
  } | null;
  latestWeight: {
    weight: number;
    reps: number;
    date: string;
  } | null;
  bestEstimated1rm: {
    weight: number;
    reps: number;
    date: string;
    estimated1rm: number;
  } | null;
  deltaFromFirst: number | null;
};

export type MovementTrendData = {
  unit: Unit;
  points: MovementTrendPoint[];
  summary: MovementTrendSummary;
};

export function buildMovementTrendData(
  entries: PrEntry[],
  unit: Unit,
  locale: string,
): MovementTrendData {
  const sorted = sortEntries(entries);

  const points: MovementTrendPoint[] = sorted.map((entry, index) => {
    const estimated1rm =
      entry.reps > 1 ? round1(estimate1rmEpley(entry.weight, entry.reps)) : null;

    return {
      id: entry.id,
      date: entry.date,
      label: formatDate(entry.date, locale),
      weight: round1(entry.weight),
      reps: entry.reps,
      estimated1rm,
      deltaFromPrevious:
        index === 0 ? null : round1(entry.weight - sorted[index - 1].weight),
    };
  });

  let bestWeight: MovementTrendSummary["bestWeight"] = null;
  let latestWeight: MovementTrendSummary["latestWeight"] = null;
  let bestEstimated1rm: MovementTrendSummary["bestEstimated1rm"] = null;

  for (const point of points) {
    if (
      !bestWeight ||
      point.weight > bestWeight.weight ||
      (point.weight === bestWeight.weight && point.date > bestWeight.date)
    ) {
      bestWeight = {
        weight: point.weight,
        reps: point.reps,
        date: point.date,
      };
    }

    if (
      point.estimated1rm != null &&
      (!bestEstimated1rm ||
        point.estimated1rm > bestEstimated1rm.estimated1rm ||
        (point.estimated1rm === bestEstimated1rm.estimated1rm &&
          point.date > bestEstimated1rm.date))
    ) {
      bestEstimated1rm = {
        weight: point.weight,
        reps: point.reps,
        date: point.date,
        estimated1rm: point.estimated1rm,
      };
    }

    latestWeight = {
      weight: point.weight,
      reps: point.reps,
      date: point.date,
    };
  }

  const summary: MovementTrendSummary = {
    entryCount: points.length,
    firstDate: points[0]?.date ?? null,
    latestDate: points[points.length - 1]?.date ?? null,
    bestWeight,
    latestWeight,
    bestEstimated1rm,
    deltaFromFirst:
      points.length > 1
        ? round1(points[points.length - 1].weight - points[0].weight)
        : null,
  };

  return { unit, points, summary };
}
