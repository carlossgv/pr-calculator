import type { Unit } from "@repo/core";
import type { MovementTrendPoint } from "../utils/movement-trends";
import styles from "./TrendChart.module.css";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function buildSegments(
  values: Array<{ x: number; y: number | null }>,
): string[] {
  const out: string[] = [];
  let current: Array<{ x: number; y: number }> = [];

  const flush = () => {
    if (current.length < 2) {
      current = [];
      return;
    }
    out.push(current.map((p) => `${p.x},${p.y}`).join(" "));
    current = [];
  };

  for (const point of values) {
    if (point.y == null) {
      flush();
      continue;
    }

    current.push({ x: point.x, y: point.y });
  }

  flush();
  return out;
}

function formatValue(value: number, unit: Unit) {
  return `${round1(value)} ${unit}`;
}

type Props = {
  points: MovementTrendPoint[];
  unit: Unit;
  ariaLabel: string;
  weightLabel: string;
  estimatedLabel: string;
};

export function TrendChart({
  points,
  unit,
  ariaLabel,
  weightLabel,
  estimatedLabel,
}: Props) {
  const width = Math.max(620, 80 + Math.max(0, points.length - 1) * 84);
  const height = 320;
  const margin = { top: 24, right: 24, bottom: 58, left: 58 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const allValues = points.flatMap((point) =>
    [point.weight, point.estimated1rm].filter(
      (value): value is number => typeof value === "number" && Number.isFinite(value),
    ),
  );

  if (allValues.length === 0) {
    return <div className={styles.empty}>—</div>;
  }

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const pad = Math.max(1, (rawMax - rawMin) * 0.08);
  const min = round1(rawMin - pad);
  const max = round1(rawMax + pad || rawMax + 1);
  const span = max - min || 1;

  const xFor = (index: number) => {
    if (points.length === 1) return margin.left + plotWidth / 2;
    return margin.left + (index / (points.length - 1)) * plotWidth;
  };

  const yFor = (value: number) =>
    margin.top + plotHeight - ((value - min) / span) * plotHeight;

  const ticks = Array.from({ length: 5 }, (_, index) => {
    const pct = index / 4;
    return round1(max - pct * span);
  });

  const weightSeries = points.map((point, index) => ({
    x: xFor(index),
    y: yFor(point.weight),
  }));

  const estimatedSeries = points.map((point, index) => ({
    x: xFor(index),
    y: point.estimated1rm == null ? null : yFor(point.estimated1rm),
  }));

  const weightSegments = buildSegments(weightSeries);
  const estimatedSegments = buildSegments(estimatedSeries);
  const labelStep = points.length <= 6 ? 1 : points.length <= 10 ? 2 : 3;

  return (
    <div className={styles.wrap}>
      <div className={styles.scroll}>
        <svg
          className={styles.chart}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            <linearGradient id="trend-weight-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => {
            const y = yFor(tick);
            return (
              <g key={`tick-${tick}`}>
                <line
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={y}
                  y2={y}
                  className={styles.gridLine}
                />
                <text
                  x={margin.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className={styles.axisLabel}
                >
                  {formatValue(tick, unit)}
                </text>
              </g>
            );
          })}

          <line
            x1={margin.left}
            x2={margin.left}
            y1={margin.top}
            y2={height - margin.bottom}
            className={styles.axis}
          />
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={height - margin.bottom}
            y2={height - margin.bottom}
            className={styles.axis}
          />

          {weightSegments.map((segment, index) => (
            <polyline
              key={`weight-line-${index}`}
              points={segment}
              className={styles.weightLine}
            />
          ))}

          {estimatedSegments.map((segment, index) => (
            <polyline
              key={`estimated-line-${index}`}
              points={segment}
              className={styles.estimatedLine}
            />
          ))}

          {points.map((point, index) => {
            const x = xFor(index);
            const weightY = yFor(point.weight);
            return (
              <g key={point.id}>
                <circle className={styles.weightPoint} cx={x} cy={weightY} r="4.5">
                  <title>
                    {`${point.label} · ${weightLabel}: ${formatValue(point.weight, unit)} · ${point.reps} reps`}
                  </title>
                </circle>

                {point.estimated1rm != null ? (
                  <circle
                    className={styles.estimatedPoint}
                    cx={x}
                    cy={yFor(point.estimated1rm)}
                    r="4"
                  >
                    <title>
                      {`${point.label} · ${estimatedLabel}: ${formatValue(point.estimated1rm, unit)}`}
                    </title>
                  </circle>
                ) : null}

                {index % labelStep === 0 || index === points.length - 1 ? (
                  <text
                    x={x}
                    y={height - margin.bottom + 24}
                    textAnchor="middle"
                    className={styles.dateLabel}
                  >
                    {point.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
