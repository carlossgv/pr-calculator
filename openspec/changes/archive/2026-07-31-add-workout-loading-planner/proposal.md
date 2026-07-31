## Why

The calculators can show percentage-based weights and individual plate details, but planning a workout still requires opening results one at a time and mentally assembling the loading sequence. A mobile-first workout loading planner will turn a current 100% weight and selected percentages into a compact, ordered preparation view.

## What Changes

- Add a workout loading planner that can be opened from both the quick calculator and a movement calculator while carrying over the current 100% weight and unit.
- Let users add, remove, and order only the percentages needed for the workout.
- Present each percentage's target weight, achievable plate-loaded weight, delta, and plate configuration per side in one scannable list.
- Add secondary add/remove transition guidance between consecutive configurations.
- Add a collapsed summary of the minimum plate inventory required near one bar to build every configuration sequentially.
- Design the planner for phone-sized screens first and constrain wider layouts to the app's existing tablet-style presentation.
- Keep physical plate-quantity tracking and availability guarantees out of scope; the planner reports calculated requirements using the configured denominations.

## Capabilities

### New Capabilities

- `workout-loading-planner`: Create and review an ordered, mobile-first workout loading plan derived from a 100% weight, selected percentages, and configured equipment.

### Modified Capabilities

None.

## Impact

- Affects the web app's quick calculator, movement calculator, routing, responsive UI, i18n strings, and local planner state or navigation state.
- Reuses the existing core load calculation and unit/equipment preference behavior.
- Requires derived helpers and tests for configuration transitions and sequential minimum inventory.
- Introduces no API, synchronization, or persistent equipment-quantity requirements.
