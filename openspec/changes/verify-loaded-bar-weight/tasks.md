## 1. Calculation and equipment

- [x] 1.1 Add a pure loaded-bar total calculation that accepts a native-unit bar and per-side plate quantities, converts mixed units before summing, and rounds only for display.
- [x] 1.2 Add focused calculation tests for bar-only, repeated denominations, 20 kg + 25 kg + 15 kg per side, and mixed kg/lb loads.

## 2. Verification screen

- [x] 2.1 Add a dedicated verification route.
- [x] 2.2 Load preferred unit, bar, and denomination choices; limit visible bars to the active unit and keep selected plates available for correction when the unit changes.
- [x] 2.3 Build the phone-first count interface with minus, count, and plus on each card, immediate clear, prominent total, and readable symmetric-load breakdown.
- [x] 2.4 Keep the current unit, bar, and counts in memory across route visits while resetting them on a full reload.
- [x] 2.5 Add the verifier to primary navigation and fit four destinations on narrow mobile screens.
- [x] 2.6 Soften content moving behind the sticky total with a blurred edge treatment.
- [x] 2.7 Remove the redundant verifier entry from the home calculator.

## 3. Polish and verification

- [x] 3.1 Add Spanish and English strings and accessible control labels; style with existing theme tokens and touch-friendly controls.
- [x] 3.2 Verify the interaction at phone width, keyboard operation, unit switching, mixed-unit breakdown, and route revisit; run the smallest relevant test and typecheck commands.
- [x] 3.3 Review the final diff for unrelated changes and confirm the OpenSpec scenarios are covered.
