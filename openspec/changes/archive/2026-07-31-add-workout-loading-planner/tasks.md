## 1. Planner Calculations

- [x] 1.1 Add typed planner helpers for percentage normalization, ordered plan rows, and existing `calculateLoad` integration.
- [x] 1.2 Add multiset helpers that derive per-side plate additions and removals between consecutive configurations.
- [x] 1.3 Add a helper that derives the minimum two-sided sequential inventory by taking each denomination's maximum per-side count across the plan.
- [x] 1.4 Add focused unit tests covering exact and adjusted loads, duplicate plates, unchanged transitions, removals, mixed units, and non-summed inventory maxima.

## 2. Mobile-First Planner Screen

- [x] 2.1 Add a dedicated planner route that defensively reads the 100% weight and unit from route parameters and supports optional movement return context.
- [x] 2.2 Build touch-friendly percentage add, validation, removal, and explicit move-up/move-down controls backed by an ordered unique percentage array.
- [x] 2.3 Build the single-column result list with percentage and weight hierarchy, target-versus-achieved delta, and inline plate configuration per side.
- [x] 2.4 Render quiet transition guidance between consecutive result rows, including an explicit no-change state.
- [x] 2.5 Add a collapsed required-inventory disclosure that reports total two-sided plate quantities and explains that availability is not verified.
- [x] 2.6 Style the planner for phone widths without horizontal scrolling and keep it centered in the existing constrained tablet-style presentation on wider screens.

## 3. Calculator Integration and Localization

- [x] 3.1 Add a planner entry action to the quick calculator that passes its current weight and unit.
- [x] 3.2 Add a planner entry action to the movement calculator that passes its current weight, unit, and movement return context.
- [x] 3.3 Add all planner and validation text to the English and Spanish i18n resources and use existing theme tokens and UI primitives throughout.

## 4. Verification

- [x] 4.1 Add component or page tests for percentage editing, ordering-driven transition updates, inventory disclosure, and invalid route/input behavior.
- [x] 4.2 Run the smallest relevant web and core tests and typechecks, fixing any regressions.
- [x] 4.3 Verify the complete flow at phone and constrained tablet widths from both calculator entry points, including mixed-unit equipment and browser reload.
- [x] 4.4 Review the final diff for unrelated changes and confirm no API, database, or synchronization schema was added.
