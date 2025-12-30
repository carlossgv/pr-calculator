// FILE: apps/web/src/pages/MovementCalculatorPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { Movement, Unit, UserPreferences } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { WeightCalculatorPanel } from "../components/WeightCalculatorPanel";
import { ArrowLeft, Settings2 } from "lucide-react";
import { Button } from "../ui/Button";
import styles from "./MovementCalculatorPage.module.css";

function parseUnit(raw: string | undefined): Unit {
  return raw === "lb" ? "lb" : "kg";
}

function parseWeight(raw: string | undefined): number {
  const n = Number(String(raw ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 100;
}

function parseNumberParam(v: string | null): number | null {
  if (v == null) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseIntParam(v: string | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && Number.isInteger(n) ? n : null;
}

export function MovementCalculatorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { movementId, unit: unitParam, weight: weightParam } = useParams<{
    movementId: string;
    unit: string;
    weight: string;
  }>();

  const id = movementId ?? "";

  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [movement, setMovement] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(true);

  const initialUnit = useMemo(() => parseUnit(unitParam), [unitParam]);
  const initialWeight = useMemo(() => parseWeight(weightParam), [weightParam]);

  const theoretical = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const isTheo = qs.get("theoretical") === "1";
    if (!isTheo) return null;

    const baseWeight = parseNumberParam(qs.get("baseWeight"));
    const baseReps = parseIntParam(qs.get("baseReps"));
    if (baseWeight == null || baseReps == null || baseWeight <= 0 || baseReps <= 0)
      return null;

    return { baseWeight, baseReps };
  }, [location.search]);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    Promise.all([repo.getPreferences(), repo.getMovement(id)])
      .then(([p, m]) => {
        setPrefs(p);
        setMovement(m);
      })
      .finally(() => setLoading(false));
  }, [id]);

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

  if (loading) return <p>{t.home.loading}</p>;

  const fallbackTitle = t.movement.title;
  const title = movement?.name ?? fallbackTitle;

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
            ariaLabel={t.movements.managePrs}
            title={t.movements.managePrs}
            onClick={goManage}
          >
            <Settings2 size={18} />
          </Button>
        </div>
      </div>

      <h2 className={styles.title}>{title}</h2>

      <WeightCalculatorPanel
        mode="editable"
        title={undefined /* el título ya va arriba */}
        initialUnit={initialUnit}
        initialWeight={initialWeight}
        theoreticalFrom={theoretical ?? undefined}
        onChange={(payload) => {
          const u = payload.unit;
          const w = payload.weight;

          // Mantiene la URL sincronizada (útil para compartir / refresh)
          // ✅ preserva querystring (para no perder modo teórico)
          navigate(
            `/movements/${id}/calc/${u}/${w}${location.search}`,
            { replace: true },
          );
        }}
      />
    </div>
  );
}
