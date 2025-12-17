
/* apps/web/src/pages/MovementCalcPage.tsx */
import { Link, useNavigate, useParams } from "react-router-dom";
import { WeightCalculatorPanel } from "../components/WeightCalculatorPanel";
import type { Unit } from "@repo/core";
import { t } from "../i18n/strings";

function parseUnit(u?: string): Unit | null {
  if (u === "kg" || u === "lb") return u;
  return null;
}

export function MovementCalcPage() {
  const navigate = useNavigate();
  const { movementId, unit, weight } = useParams<{
    movementId: string;
    unit: string;
    weight: string;
  }>();

  if (!movementId) return null;

  const initialUnit = parseUnit(unit) ?? "kg";
  const parsedWeight = Number(weight);
  const initialWeight =
    Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 100;

  function handleChange(next: { unit: Unit; weight: number }) {
    navigate(`/movements/${movementId}/calc/${next.unit}/${next.weight}`, {
      replace: true,
    });
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <Link to="/movements">{t.movement.back}</Link>

        <Link to={`/movements/${movementId}/manage`} style={{ fontWeight: 800 }}>
          Manage PRs
        </Link>
      </div>

      <WeightCalculatorPanel
        mode="readonly"
        title={t.movement.title}
        initialUnit={initialUnit}
        initialWeight={initialWeight}
        onChange={handleChange}
      />
    </div>
  );
}

