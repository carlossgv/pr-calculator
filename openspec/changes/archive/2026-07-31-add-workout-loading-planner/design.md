## Context

The quick and movement calculators already accept a 100% weight, resolve unit-specific equipment preferences, and use `calculateLoad` to generate practical plate configurations. Their current percentage grid is optimized for browsing a broad range and opens one configuration at a time. The new planner instead needs an intentionally selected, ordered set of percentages visible together as a workout preparation flow.

The app is primarily mobile. Wider displays use a constrained tablet-style shell, so the planner must preserve a single-column information hierarchy rather than introduce a desktop-specific multi-column dashboard. Equipment preferences describe available denominations but not physical plate counts; calculated requirements therefore cannot be validated against real inventory.

## Goals / Non-Goals

**Goals:**

- Carry the current 100% weight and unit from either calculator into a dedicated planner.
- Make percentage weight and inline plate configuration the first and second levels of information.
- Let plan order represent workout order and derive transitions from it.
- Derive a mathematically correct minimum inventory for one bar used sequentially.
- Produce a touch-friendly phone experience that remains constrained on wider screens.
- Reuse existing calculation, equipment, styling, and localization patterns.

**Non-Goals:**

- Tracking owned plate quantities or guaranteeing physical availability.
- Planning multiple bars or simultaneous lifting stations.
- Persisting or synchronizing named workout templates in the first version.
- Replacing the existing percentage browser in either calculator.
- Changing the practical load-selection algorithm.

## Decisions

### Use a dedicated route with source entry actions

Add a planner route whose path contains the unit and 100% weight so reload and route restoration retain the essential calculation basis. Calculator entry actions navigate to it, with optional movement source context carried in the URL when needed for title and return navigation.

A dedicated route is preferable to a modal or wizard because users need to add, remove, reorder, and review several results repeatedly. It also matches the app's mobile screen model and avoids placing a large nested interaction over an already dense calculator.

### Keep plan selection ephemeral

The selected percentages and expanded/collapsed UI state remain local to the planner for the first version. The source weight and unit are route-backed, but the feature will not add a stored workout-plan model or sync payload. This keeps the scope focused and avoids prematurely defining templates, histories, or cross-device behavior.

If reload preservation of selected percentages later proves important, it can be added through compact query parameters or a local draft without changing the calculation model.

### Model percentage order explicitly

Planner state starts with an empty ordered unique percentage array so the app does not assume a workout progression. New percentages are appended, while users can move items using explicit touch- and keyboard-accessible controls. Dragging may be added as an enhancement, but it cannot be the only reorder mechanism.

Transitions always use adjacent entries in this array. The UI must not silently sort the plan after manual reordering.

### Derive every result from the existing load calculator

For each percentage, compute the mathematical target from the 100% basis and pass it through the current unit-specific preferences and `calculateLoad`. The planner displays target, achieved total, delta, bar, and plates per side from this result. This ensures planner output matches both current calculators and retains mixed-unit plate behavior.

Shared pure helpers should normalize percentage values and derive planner rows so calculation behavior is testable separately from the page.

### Treat plate configurations as multisets

Transitions compare consecutive `platesPerSide` arrays as multisets keyed by stable plate identity, primarily native unit and denomination. Repeated plates increment counts. The difference produces per-side additions and removals; an empty difference becomes “no change.” Labels remain display metadata and do not define quantity identity.

Inventory folds across every per-side multiset and keeps the maximum count observed for each identity, then doubles it for a two-sided total. It excludes the bar and is explicitly labeled as required inventory for sequential use, not verified availability.

### Use progressive disclosure in a single-column result list

Each result row displays percentage and weight first, plate configuration second, and the transition to the next row as a quieter connector. A dedicated control isolated at the far right opens the existing plate-detail diagram in a modal; the rest of the row remains inert to avoid accidental activation. The required-inventory summary is collapsed by default beneath the plan. Phone layouts use full-width stacked controls and rows; existing app container conventions constrain the same layout on tablet and desktop widths.

All new user-facing text belongs in the English and Spanish i18n files. Styling uses existing theme tokens and UI primitives; no new hardcoded application colors are required.

## Risks / Trade-offs

- [Configured denominations imply unlimited quantities] → Label inventory as required, never available, and keep owned-quantity tracking out of scope.
- [Many selected percentages can create a long phone screen] → Use compact rows, inline transitions, and a collapsed inventory section rather than nested detail cards.
- [Target and achieved weights can be confused] → Make the primary label explicit and show achieved weight plus signed delta whenever they differ.
- [Manual order can conflict with automatic sorting] → Preserve explicit array order after the user reorders and derive transitions only from that order.
- [Mixed-unit plates can be grouped incorrectly] → Key calculations by native unit and denomination, and reuse existing formatting conventions for display.
- [Route parameters can contain invalid values] → Reuse defensive unit and weight parsing and provide a safe calculator-compatible fallback.

## Migration Plan

This is an additive client-side feature with no database or API migration. Release the new route and calculator entry actions together. Rollback consists of removing those entry actions and route; existing calculator behavior and stored data remain unaffected.

## Open Questions

- Should a later iteration persist the most recent percentage plan or support named workout templates?
