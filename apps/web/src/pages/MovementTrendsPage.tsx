import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Movement, PrEntry, UserPreferences } from "@repo/core";
import { ArrowLeft, Calculator, Settings2, TrendingUp } from "lucide-react";
import { repo } from "../storage/repo";
import { t, useLanguage } from "../i18n/strings";
import { Button } from "../ui/Button";
import { Surface, Sticker } from "../ui/Surface";
import { TrendChart } from "../components/TrendChart";
import { buildMovementTrendData } from "../utils/movement-trends";
import styles from "./MovementTrendsPage.module.css";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function formatLift(value: number, reps: number, unit: string) {
  return `${round1(value)} ${unit} × ${reps}`;
}

function formatDelta(value: number | null, unit: string) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${round1(value)} ${unit}`;
}

export function MovementTrendsPage() {
  const navigate = useNavigate();
  const language = useLanguage();
  const { movementId } = useParams<{ movementId: string }>();
  const id = movementId ?? "";

  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [movement, setMovement] = useState<Movement | null>(null);
  const [entries, setEntries] = useState<PrEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);

    Promise.all([repo.getPreferences(), repo.getMovement(id), repo.listPrEntries(id)])
      .then(([nextPrefs, nextMovement, nextEntries]) => {
        if (cancelled) return;
        setPrefs(nextPrefs);
        setMovement(nextMovement);
        setEntries(nextEntries);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    document.title = movement ? `${movement.name} · ${t.trends.title}` : t.trends.title;
  }, [movement, language]);

  const unit = prefs?.defaultUnit ?? "kg";

  const data = useMemo(() => buildMovementTrendData(entries, unit, language), [
    entries,
    unit,
    language,
  ]);

  const bestWeight = data.summary.bestWeight;
  const latestWeight = data.summary.latestWeight;
  const bestEstimated = data.summary.bestEstimated1rm;

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/movements", { replace: true });
  }

  function goManage() {
    navigate(`/movements/${id}/manage`);
  }

  function goCalc() {
    const target = latestWeight?.weight ?? bestWeight?.weight ?? 100;
    navigate(`/movements/${id}/calc/${unit}/${target}`);
  }

  if (loading) return <p>{t.home.loading}</p>;

  if (!movement) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Button
            variant="neutral"
            size="md"
            shape="round"
            iconOnly
            className={styles.iconBtnMd}
            ariaLabel={t.movement.back}
            title={t.movement.back}
            onClick={goBack}
          >
            <ArrowLeft size={18} />
          </Button>
        </div>

        <Surface variant="panel" className={styles.emptyPanel}>
          <div className={styles.emptyTitle}>{t.trends.notFoundTitle}</div>
          <div className={styles.emptyText}>{t.trends.notFoundBody}</div>
          <Button variant="primary" size="lg" shape="pill" onClick={goBack}>
            {t.movement.back}
          </Button>
        </Surface>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Button
          variant="neutral"
          size="md"
          shape="round"
          iconOnly
          className={styles.iconBtnMd}
          ariaLabel={t.movement.back}
          title={t.movement.back}
          onClick={goBack}
        >
          <ArrowLeft size={18} />
        </Button>

        <div className={styles.topActions}>
          <Button
            variant="neutral"
            size="md"
            shape="round"
            iconOnly
            className={styles.iconBtnMd}
            ariaLabel={t.movements.openCalculator}
            title={t.movements.openCalculator}
            onClick={goCalc}
          >
            <Calculator size={18} />
          </Button>

          <Button
            variant="neutral"
            size="md"
            shape="round"
            iconOnly
            className={styles.iconBtnMd}
            ariaLabel={t.movements.managePrs}
            title={t.movements.managePrs}
            onClick={goManage}
          >
            <Settings2 size={18} />
          </Button>
        </div>
      </div>

      <div className={styles.hero}>
        <h2 className={styles.title}>{movement.name}</h2>
        <div className={styles.heroMeta}>
          <Sticker stamp={<span>{t.trends.title}</span>}>PR CALC</Sticker>
          <span className={styles.heroSub}>{unit}</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <Surface variant="panel" className={styles.emptyPanel}>
          <div className={styles.emptyTitle}>{t.trends.emptyTitle}</div>
          <div className={styles.emptyText}>{t.trends.emptyBody}</div>
          <div className={styles.emptyActions}>
            <Button variant="primary" size="lg" shape="pill" onClick={goManage}>
              {t.movements.managePrs}
            </Button>
            <Button variant="ghost" size="lg" shape="pill" onClick={goCalc}>
              {t.movements.openCalculator}
            </Button>
          </div>
        </Surface>
      ) : (
        <>
          <section className={styles.summaryGrid} aria-label={t.trends.summaryTitle}>
            <Surface variant="card" className={styles.summaryCard}>
              <div className={styles.summaryLabel}>{t.trends.summary.entries}</div>
              <div className={styles.summaryValue}>{data.summary.entryCount}</div>
              <div className={styles.summaryMeta}>{t.trends.summary.entriesMeta}</div>
            </Surface>

            <Surface variant="card" className={styles.summaryCard}>
              <div className={styles.summaryLabel}>{t.trends.summary.bestWeight}</div>
              <div className={styles.summaryValue}>
                {bestWeight ? formatLift(bestWeight.weight, bestWeight.reps, unit) : "—"}
              </div>
              <div className={styles.summaryMeta}>
                {bestWeight ? bestWeight.date.slice(0, 10) : "—"}
              </div>
            </Surface>

            <Surface variant="card" className={styles.summaryCard}>
              <div className={styles.summaryLabel}>{t.trends.summary.latestWeight}</div>
              <div className={styles.summaryValue}>
                {latestWeight ? formatLift(latestWeight.weight, latestWeight.reps, unit) : "—"}
              </div>
              <div className={styles.summaryMeta}>
                {latestWeight ? latestWeight.date.slice(0, 10) : "—"}
              </div>
            </Surface>

            <Surface variant="card" className={styles.summaryCard}>
              <div className={styles.summaryLabel}>{t.trends.summary.bestEstimated1rm}</div>
              <div className={styles.summaryValue}>
                {bestEstimated ? `${round1(bestEstimated.estimated1rm)} ${unit}` : "—"}
              </div>
              <div className={styles.summaryMeta}>
                {bestEstimated ? `${bestEstimated.weight} ${unit} × ${bestEstimated.reps}` : "—"}
              </div>
            </Surface>
          </section>

          <Surface variant="panel" className={styles.chartPanel}>
            <div className={styles.sectionHeading}>
              <div>
                <div className={styles.sectionTitle}>{t.trends.chartTitle}</div>
                <div className={styles.sectionHint}>{t.trends.chartHint}</div>
              </div>

              <div className={styles.legend} aria-label={t.trends.legendTitle}>
                <span className={styles.legendItem}>
                  <span className={styles.legendSwatchWeight} />
                  {t.trends.legendWeight}
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.legendSwatchEstimated} />
                  {t.trends.legendEstimated}
                </span>
              </div>
            </div>

            <TrendChart
              unit={unit}
              points={data.points}
              ariaLabel={t.trends.chartAria}
              weightLabel={t.trends.legendWeight}
              estimatedLabel={t.trends.legendEstimated}
            />
          </Surface>

          <Surface variant="panel" className={styles.historyPanel}>
            <div className={styles.sectionHeading}>
              <div>
                <div className={styles.sectionTitle}>{t.trends.historyTitle}</div>
                <div className={styles.sectionHint}>{t.trends.historyHint}</div>
              </div>
              <TrendingUp size={18} />
            </div>

            <div className={styles.historyList}>
              {data.points
                .slice()
                .reverse()
                .map((point) => (
                  <div key={point.id} className={styles.historyRow}>
                    <div className={styles.historyMain}>
                      <div className={styles.historyDate}>{point.label}</div>
                      <div className={styles.historyLift}>
                        {formatLift(point.weight, point.reps, unit)}
                      </div>
                    </div>

                    <div className={styles.historyMeta}>
                      <div className={styles.historyMetric}>
                        <span className={styles.historyMetricLabel}>
                          {t.trends.historyDelta}
                        </span>
                        <span className={styles.historyMetricValue}>
                          {formatDelta(point.deltaFromPrevious, unit)}
                        </span>
                      </div>

                      <div className={styles.historyMetric}>
                        <span className={styles.historyMetricLabel}>
                          {t.trends.historyEstimated1rm}
                        </span>
                        <span className={styles.historyMetricValue}>
                          {point.estimated1rm != null
                            ? `${point.estimated1rm} ${unit}`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Surface>
        </>
      )}
    </div>
  );
}
