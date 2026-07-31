import { describe, expect, it } from "vitest";
import {
  CROSSFIT_LB_WITH_KG_CHANGES,
  DEFAULT_PREFS,
  type PlatePick,
  type UserPreferences,
} from "@repo/core";
import {
  addPlannerPercentage,
  buildPlannerPath,
  buildPlannerRows,
  derivePlateTransition,
  deriveSequentialInventory,
  movePlannerPercentage,
  normalizePlannerPercentage,
} from "./workout-loading-planner";

function pick(value: number, unit: "kg" | "lb" = "kg"): PlatePick {
  return { plate: { value, unit }, valueInUnit: value };
}

describe("workout loading planner", () => {
  it("normalizes, validates, adds, and moves percentages", () => {
    expect(normalizePlannerPercentage("87,54% ")).toBe(87.5);
    expect(normalizePlannerPercentage(0)).toBeNull();
    expect(normalizePlannerPercentage(301)).toBeNull();
    expect(addPlannerPercentage([60, 80], 70)).toEqual([60, 80, 70]);
    expect(addPlannerPercentage([60, 70], 70)).toBeNull();
    expect(movePlannerPercentage([60, 70, 80], 1, -1)).toEqual([70, 60, 80]);
    expect(
      buildPlannerPath("kg", 180, {
        movementId: "back squat",
        returnTo: "/movements/back squat/calc/kg/180?theoretical=1",
      }),
    ).toBe(
      "/planner/kg/180?movementId=back+squat&returnTo=%2Fmovements%2Fback+squat%2Fcalc%2Fkg%2F180%3Ftheoretical%3D1",
    );
  });

  it("builds exact and adjusted load rows with signed deltas", () => {
    const prefs: UserPreferences = {
      ...DEFAULT_PREFS,
      plates: [{ value: 20, unit: "kg" }],
    };
    const rows = buildPlannerRows(100, [100, 73], "kg", prefs);

    expect(rows[0].targetWeight).toBe(100);
    expect(rows[0].achievedWeight).toBe(100);
    expect(rows[0].signedDelta).toBe(0);
    expect(rows[1].targetWeight).toBe(73);
    expect(rows[1].achievedWeight).not.toBe(73);
    expect(rows[1].signedDelta).toBe(rows[1].achievedWeight - 73);
  });

  it("derives additions, removals, duplicate quantities, and unchanged transitions", () => {
    expect(derivePlateTransition([pick(20), pick(10)], [pick(20), pick(20), pick(5)])).toEqual({
      add: [expect.objectContaining({ count: 1, key: "kg:20" }), expect.objectContaining({ count: 1, key: "kg:5" })],
      remove: [expect.objectContaining({ count: 1, key: "kg:10" })],
      unchanged: false,
    });
    expect(derivePlateTransition([pick(20)], [pick(20)])).toEqual({
      add: [],
      remove: [],
      unchanged: true,
    });
  });

  it("uses per-configuration maxima rather than summing inventory", () => {
    const prefs: UserPreferences = {
      ...DEFAULT_PREFS,
      plates: [{ value: 20, unit: "kg" }],
    };
    const rows = buildPlannerRows(180, [55.5, 100], "kg", prefs);
    const inventory = deriveSequentialInventory(rows);

    expect(inventory).toHaveLength(1);
    expect(inventory[0].key).toBe("kg:20");
    expect(inventory[0].count).toBe(8);
  });

  it("keeps native units distinct in mixed-unit transitions and inventory", () => {
    const rows = buildPlannerRows(250, [60, 80], "lb", CROSSFIT_LB_WITH_KG_CHANGES);
    const inventory = deriveSequentialInventory(rows);
    const transition = derivePlateTransition(
      rows[0].load.platesPerSide,
      rows[1].load.platesPerSide,
    );

    expect(inventory.some((item) => item.pick.plate.unit === "lb")).toBe(true);
    expect(
      [...transition.add, ...transition.remove].every((item) =>
        item.key.startsWith(`${item.pick.plate.unit}:`),
      ),
    ).toBe(true);
  });
});
