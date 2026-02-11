# Handoff

Date: 2026-02-11
Branch: spike/flat-theme

## Summary
- Completed a broad UI simplification pass focused on flatter visuals, clearer hierarchy, and safer form actions.
- Fixed web build blockers (`Check` import + Workbox SW generation crash workaround).
- Added explicit close controls in modal flows while keeping outside-click dismissal.
- Simplified calculator and movement-page header chrome (removed right badge chips and barcode strip).
- Refined weight calculator UX:
  - Custom `%` moved to compact modal flow.
  - Unit toggle moved into hero input badge and made visibly interactive.
- Updated preferences UI:
  - Unit/plate presets renamed to Metric/Imperial (UI-only).
  - Theme toggle now uses segmented icon control to match other toggles.
- Simplified input focus borders to remove double-outline effect.
- Added primary accent color picker (single base color drives theme accents).
- Improved Movement Details UX:
  - Add PR weight defaults to empty (no `100` prefill).
  - Add PR CTA is disabled until required fields are valid.
  - Top bordered form section separated from PR list section.
- Simplified and improved readability of percent tiles and weight-detail modal.

## Recent commits on `spike/flat-theme`
- `d7d4e64` fix(web): restore build by importing Check and stabilizing PWA SW generation
- `567f7d6` feat(web): retone theme and normalize Material-style radii
- `9093e4c` feat(web): move custom percent controls to compact modal flow
- `6a81961` feat(web): harden add-pr form and split movement detail list section
- `90e5037` feat(web): add explicit close control to percent detail modal
- `fb99913` style(web): simplify header chrome across calculator and movement pages
- `201b9a7` feat(web): move unit toggle into hero input with clearer affordance
- `8d9a723` style(web): center mobile modals and unify close control behavior
- `c973f2d` style(web): improve percent card readability and tile layout
- `dea4454` refactor(web): simplify weight detail modal and align fact rows

## Separate experimental branch
- `feature/theme-vibrant-palettes`
- Commit: `154e5ec` (`feat(web): add vibrant multi-palette high-contrast theme options`)
- Scope:
  - Added persisted palette selector (`Electric`, `Sunset`, `Mint`) in Preferences.
  - Added theme palette storage/retrieval in repo meta.
  - Added palette-aware CSS token overrides in `global.css`.
  - Not merged into `spike/flat-theme`.

## Key files touched in this iteration
- `apps/web/src/global.css`
- `apps/web/src/ui/Modal.module.css`
- `apps/web/src/ui/Modal.tsx`
- `apps/web/src/ui/AppLayout.tsx`
- `apps/web/src/pages/PreferencesPage.tsx`
- `apps/web/src/pages/PreferencesPage.module.css`
- `apps/web/src/pages/MovementDetailsPage.tsx`
- `apps/web/src/pages/MovementDetailsPage.module.css`
- `apps/web/src/pages/MovementsPage.tsx`
- `apps/web/src/pages/MovementsPage.module.css`
- `apps/web/src/components/WeightCalculatorPanel.tsx`
- `apps/web/src/components/WeightCalculatorPanel.module.css`
- `apps/web/src/components/PercentCards.tsx`
- `apps/web/src/components/PercentCards.module.css`
- `apps/web/src/theme/theme.ts`
- `apps/web/src/storage/repo.ts`

## Open items
- Android keyboard/bottom nav gap behavior still needs device-level validation and final behavior decision.
- Decide whether to merge/adapt the `feature/theme-vibrant-palettes` branch.

## Workflow checklist
- Environments: `staging`, `production`
- Secrets (env-scoped): `TS_AUTHKEY`, `NTFY_TOKEN`
- Vars (env-scoped): `API_URL`, `TS_LOGIN_SERVER`, `DEPLOY_HOST_TS`, `DEPLOY_PATH`, `SERVER_USER`, `NTFY_URL`
