import { useEffect, useMemo, useState } from "react";
import type { Unit } from "@repo/core";
import { WeightCalculatorPanel } from "./WeightCalculatorPanel";
import { WorkoutPlannerPanel } from "./WorkoutPlannerPanel";
import { Button } from "../ui/Button";
import { t } from "../i18n/strings";
import styles from "./CalculatorWorkspace.module.css";

type WorkspaceTab = "calculator" | "workout";

type Props = {
  initialUnit?: Unit;
  initialWeight?: number;
  initialCustomPcts?: number[];
  onChange?: (payload: { unit: Unit; weight: number }) => void;
  onCustomPctsChange?: (pcts: number[]) => void;
  theoreticalFrom?: {
    baseWeight: number;
    baseReps: number;
  };
  plannerScope?: string;
  activeTab?: WorkspaceTab;
  onActiveTabChange?: (tab: WorkspaceTab) => void;
};

export function CalculatorWorkspace({
  initialUnit,
  initialWeight,
  initialCustomPcts,
  onChange,
  onCustomPctsChange,
  theoreticalFrom,
  plannerScope = "",
  activeTab,
  onActiveTabChange,
}: Props) {
  const [localTab, setLocalTab] = useState<WorkspaceTab>("calculator");
  const [baseUnit, setBaseUnit] = useState<Unit>(initialUnit ?? "kg");
  const [baseWeight, setBaseWeight] = useState<number>(initialWeight ?? 100);

  useEffect(() => {
    if (typeof initialUnit === "string") setBaseUnit(initialUnit);
  }, [initialUnit]);

  useEffect(() => {
    if (typeof initialWeight === "number" && Number.isFinite(initialWeight)) {
      setBaseWeight(initialWeight);
    }
  }, [initialWeight]);

  const currentTab = activeTab ?? localTab;
  const setTab = onActiveTabChange ?? setLocalTab;

  const calculator = useMemo(
    () => (
      <WeightCalculatorPanel
        mode="editable"
        initialUnit={initialUnit}
        initialWeight={initialWeight}
        initialCustomPcts={initialCustomPcts}
        onCustomPctsChange={onCustomPctsChange}
        onChange={(payload) => {
          setBaseUnit(payload.unit);
          setBaseWeight(payload.weight);
          onChange?.(payload);
        }}
        theoreticalFrom={theoreticalFrom}
      />
    ),
    [
      initialCustomPcts,
      initialUnit,
      initialWeight,
      onChange,
      onCustomPctsChange,
      theoreticalFrom,
    ],
  );

  return (
    <div className={styles.workspace}>
      <div className={styles.tabBar} role="tablist" aria-label={t.workout.title}>
        <Button
          variant={currentTab === "calculator" ? "primary" : "neutral"}
          size="sm"
          shape="pill"
          className={styles.tabBtn}
          role="tab"
          aria-selected={currentTab === "calculator"}
          onClick={() => setTab("calculator")}
        >
          {t.workout.calculatorTab}
        </Button>

        <Button
          variant={currentTab === "workout" ? "primary" : "neutral"}
          size="sm"
          shape="pill"
          className={styles.tabBtn}
          role="tab"
          aria-selected={currentTab === "workout"}
          onClick={() => setTab("workout")}
        >
          {t.workout.workoutTab}
        </Button>
      </div>

      <div hidden={currentTab !== "calculator"}>{calculator}</div>

      <div hidden={currentTab !== "workout"}>
        <WorkoutPlannerPanel
          scope={plannerScope}
          baseUnit={baseUnit}
          baseWeight={baseWeight}
        />
      </div>
    </div>
  );
}
