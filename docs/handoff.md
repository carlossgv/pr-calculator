# Handoff

Date: 2026-03-09
Branch: staging

## Summary

- Added automated test infrastructure using Vitest across core, web, and api.
- Added colocated unit tests for high-risk logic:
  - `packages/core`: unit conversion and plate math.
  - `apps/web`: equipment resolution and repo storage/sanitization behavior.
- Added API controller tests in `apps/api/test` with Prisma mocked at module boundary.
- Added Husky `pre-push` hook to block pushes unless full `build` and `test` pass.
- Root scripts now use Turbo again after upgrade:
  - Upgraded to `turbo 2.8.10`.
  - Restored `build: turbo build`, `test: turbo test`, and `turbo.json` `test` pipeline task.
- Added Android native backup export support through a Capacitor plugin.
- Fixed load calculation to choose the closest achievable plate combination to the entered target instead of greedily filling to a rounded target.
- Made preference reads tolerant of older/synced blobs missing `rounding` and removed preset detection's dependency on that field.

## Commits (latest first)

- `b6b8fec` fix: choose closest achievable plate load
- `05550a1` chore: update turbo
- `b97bdf2` chore: update handoff
- `744d00f` wip: export in android native
- `a7601f3` docs: update handoff for test infra and turbo restoration
- `2651326` build: restore turbo build/test after upgrade to 2.8.9
- `73b5348` test: add vitest suites and pre-push build+test hook
- `3bd7d8b` build(android): add semver bump flags to AAB script and docs
- `9528024` web: move donation section to top of preferences
- `76a8c60` web: unify modal blur and accent border styles
- `8fb2d8b` fix: env variable docker file prd
- `19794a4` fix: env variable docker file prd

## Key files touched in this iteration

- `package.json`
- `turbo.json`
- `pnpm-lock.yaml`
- `.husky/pre-push`
- `packages/core/vitest.config.ts`
- `packages/core/src/units.test.ts`
- `packages/core/src/bar-maths.test.ts`
- `packages/core/src/bar-maths.ts`
- `apps/web/vitest.config.ts`
- `apps/web/src/test/setup.ts`
- `apps/web/src/utils/nearest-loadable.test.ts`
- `apps/web/src/utils/equipment.test.ts`
- `apps/web/src/storage/repo.test.ts`
- `apps/web/src/storage/repo.ts`
- `apps/web/src/pages/PreferencesPage.tsx`
- `apps/web/src/storage/backup.ts`
- `apps/api/vitest.config.ts`
- `apps/api/test/bootstrap.controller.test.ts`
- `apps/api/test/sync.controller.test.ts`
- `apps/native/android/app/src/main/java/dev/carlosgv/prcalculator/BackupExportPlugin.java`
- `apps/native/android/app/src/main/java/dev/carlosgv/prcalculator/MainActivity.java`

## Notes

- `rounding` is no longer used by the active load calculation path, but reads now backfill it for compatibility with older stored/synced preferences.
- Branch currently passes the repo pre-push gate (`pnpm build` and `pnpm test`).
