# WOD Plate Strategy Planner

## Summary
- Add a workout-planning mode inside the existing calculator flow, available from both Home and Movement calculators.
- The planner lets the user build an ordered sequence of percentages by tapping percent cards, then reorder with simple move controls.
- A precision slider trades convenience vs accuracy in real time, and the solver defaults to fastest swaps.
- Output includes step-by-step change instructions and a rack summary of plates to stage nearby.
- Persist one local draft per device and add a quick reset that clears only the workout plan.

## Key Changes
- Extend the shared calculator surface with a workout planner section that reuses the current equipment, unit, and plate rendering conventions.
- Add optimizer controls for fastest swaps, fewest types, and closest load.
- Add a precision slider that affects load selection and swap-vs-accuracy weighting.
- Add a sequence planner result model with per-step achieved load, delta, transitions, and rack summary.
- Store the planner draft separately from the quick calculator draft in local Dexie storage.

## Test Plan
- Unit test the planner for stable repeated percentages, transition generation, and rack summary aggregation.
- Add repo tests for the new local draft shape and sanitization.
- Smoke test the Home and Movement entry points with kg and lb setups.

## Assumptions
- v1 is local-only and does not require backend or sync changes.
- The workout planner is additive and does not replace the existing calculator.
- Repeated percentages keep the same plate setup inside one plan.
