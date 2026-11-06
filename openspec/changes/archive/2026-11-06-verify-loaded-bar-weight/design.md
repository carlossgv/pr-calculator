## Context

The home page hosts the quick PR calculator, while the existing planner turns a target weight into plates per side. Equipment preferences already define a bar, default unit, plate contexts, and available denominations. The new workflow starts with the physical plates observed on one side and needs a result after each tap, especially on a phone during judging.

## Goals / Non-Goals

**Goals:**
- Reach verification directly from primary navigation and show a legible total as the primary result.
- Count one side with large denomination controls, immediate updates, and easy correction.
- Reuse configured equipment, including lb plates with kg change plates.
- Make the symmetric-loading assumption and calculation visible.

**Non-Goals:**
- Recording attempts, PRs, or plate counts across sessions.
- Planning target loads or enforcing physical plate inventory.
- Counting asymmetric sides, collars, or other accessories.

## Decisions

### Dedicated focused route

Add a "Barra" destination in the primary navigation and a separate route using the app's existing layout. The screen has a back action, a prominent total, bar and unit controls, plate steppers, and a clear action. This keeps the quick calculator's 100% weight semantics separate from the observed loaded weight. An inline panel on home was considered, but would compete with the calculator's existing controls and results.

### Tap-to-count interaction

Each denomination card contains a minus button, count, and plus button in one place. Updates require no submit step or numeric keyboard. A reset action clears counts without changing the selected bar or unit. Dragging plates on a diagram was considered, but requires more precision and screen space for the same calculation. The existing plate diagram can inform visual styling, while text and quantity remain authoritative. The result stays sticky during scrolling with a blurred halo to soften content moving behind its edges.

### Equipment and arithmetic

Initialize the unit from `defaultUnit` and the bar from the resolved bar preference for that unit. Offer only the two standard bars for the active context (20/15 kg or 45/35 lb). Use `prefsForUnit` for denomination choices; preserve each selected plate's native value and unit. Switching context changes the bar to the equivalent type in the new unit, updates available denominations and the displayed total unit, and retains selected plates in their native units. Selected plates from the previous context remain visible as cards so they can be removed without switching back. Compute `bar + 2 × sum(plates on one side)` by converting to a common unit before summing; round only the displayed total. The breakdown retains native denomination labels so a mixed-unit load is auditable.

### Session state

The selected unit, bar, and plate counts live in a module-level session snapshot that survives route unmounts within the current app load. The page initializes from that snapshot when revisited, or from equipment preferences on the first visit. No count is written to local storage or sync; a full reload starts a new session. The clear action removes counts immediately, with no confirmation step to slow routine use.

### Accessibility and localization

Use text labels that say "discos de un lado", accessible add/remove names with denomination and quantity, and a text breakdown under the large result. Controls must be usable by touch and keyboard. Add Spanish and English strings in the existing i18n files and use theme tokens for color and emphasis.

## Risks / Trade-offs

- **Symmetry assumption could be missed** → Keep "discos de un lado" visible beside the controls and show the doubling in the calculation.
- **Mixed kg/lb values can produce fractional display totals** → Preserve native values internally and round only the final display value; show native units in the breakdown.
- **Configured denominations do not represent actual inventory counts** → Treat them as quick-add choices, not a claim about plate availability.
- **A full reload clears a partial count** → Acceptable for an ephemeral verification; the empty state makes it obvious that a fresh count is needed.

## Migration Plan

No persisted data or API changes. The feature can be removed by dropping its navigation entry and route; existing preferences remain valid.

## Open Questions

None for the initial scope.
