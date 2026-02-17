# Handoff

Date: 2026-02-17
Branch: staging

## Summary
- Standardized modal visuals in web:
  - Shared modal overlay now applies background blur.
  - Shared modal container now uses the accent border + stronger shadow by default.
- Unified weight calculator mobile details with shared modal:
  - Replaced custom mobile detail dialog in percent cards with `ui/Modal`.
  - Removed obsolete custom overlay/modal CSS in percent cards.
- Simplified modal usage call sites:
  - Removed now-redundant per-modal border overrides from Preferences accent modal and onboarding changelog modal.
- Preferences UX update:
  - Moved donation section to the top of the Preferences page for visibility.
- Android release tooling update:
  - Extended `scripts/build-android-aab.sh` with semver bump flags:
    - `--patch`, `--minor`, `--major`, and `--bump patch|minor|major`
  - Script now bumps `versionName` and increments `versionCode` when a bump flag is passed.
  - Documented release script usage in `apps/native/README.md`.
  - Current Android app version in `apps/native/android/app/build.gradle`:
    - `versionName "1.0.6"`
    - `versionCode 7`

## Commits (latest first)
- `3bd7d8b` build(android): add semver bump flags to AAB script and docs
- `9528024` web: move donation section to top of preferences
- `76a8c60` web: unify modal blur and accent border styles
- `8fb2d8b` fix: env variable docker file prd
- `19794a4` fix: env variable docker file prd

## Key files touched in this iteration
- `apps/web/src/ui/Modal.module.css`
- `apps/web/src/components/PercentCards.tsx`
- `apps/web/src/components/PercentCards.module.css`
- `apps/web/src/pages/PreferencesPage.tsx`
- `apps/web/src/pages/PreferencesPage.module.css`
- `apps/web/src/ui/AppLayout.tsx`
- `apps/web/src/global.css`
- `scripts/build-android-aab.sh`
- `apps/native/README.md`
- `apps/native/android/app/build.gradle`

## Notes
- The old handoff content (2026-02-11, `spike/vibrant-themes`) has been superseded by this branch-level handoff.
