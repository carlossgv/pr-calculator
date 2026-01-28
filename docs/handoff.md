# Handoff

Date: 2026-01-28
Branch: feat/plate-visuals

## Summary
- Added a bar-view plate diagram in the percent detail modal (one side) with labels.
- KG plates use standard colors and real-life diameter groupings (25/20/15/10 same, 5 smaller, fraction sizes tiered).
- LB plates use a constant diameter and grayscale color; thickness scales by plate value.
- Removed 1.25 kg plate defaults; added 2, 1.5, 1, 0.5 kg fractions in defaults.

## Files touched
- apps/web/src/components/PercentCards.tsx
- apps/web/src/components/PercentCards.module.css
- apps/web/src/i18n/strings.en.ts
- apps/web/src/i18n/strings.es.ts
- apps/web/src/utils/equipment.ts
- packages/core/src/defaults.ts

## Decisions
- Plate sizes are grouped by realistic diameter tiers rather than proportional scaling.
- Labels are rendered directly on plates for quick read.

## TODO (next)
- Fix auto update using SSH (currently not working).
