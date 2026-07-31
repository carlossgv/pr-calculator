import { describe, expect, it } from "vitest";
import { parsePlannerRouteParams } from "./WorkoutLoadingPlannerPage";

describe("WorkoutLoadingPlannerPage route params", () => {
  it("preserves valid planner values across reloads", () => {
    expect(parsePlannerRouteParams("lb", "315.5")).toEqual({
      unit: "lb",
      weight: 315.5,
    });
  });

  it("falls back safely for invalid route values", () => {
    expect(parsePlannerRouteParams("stones", "invalid")).toEqual({
      unit: "kg",
      weight: 100,
    });
    expect(parsePlannerRouteParams("kg", "-20")).toEqual({
      unit: "kg",
      weight: 100,
    });
  });
});
