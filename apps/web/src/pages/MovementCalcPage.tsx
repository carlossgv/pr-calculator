// apps/web/src/pages/MovementCalcPage.tsx
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
  const initialWeight = Number(weight);

  function handleChange(next: { unit: Unit; weight: number }) {
    navigate(
      `/movements/${movementId}/calc/${next.unit}/${next.weight}`,
      { replace: true },
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Link to={`/movements/${movementId}`}>{t.movement.back}</Link>

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
