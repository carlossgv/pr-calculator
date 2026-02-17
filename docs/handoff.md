# Handoff

Date: 2026-02-17
Branch: staging

## Summary
- Added automated test infrastructure using Vitest across core, web, and api.
- Added colocated unit tests for high-risk logic:
  - `packages/core`: unit conversion and plate math.
  - `apps/web`: load rounding, equipment resolution, and repo storage/sanitization behavior.
- Added API controller tests in `apps/api/test` with Prisma mocked at module boundary.
- Added Husky `pre-push` hook to block pushes unless full `build` and `test` pass.
- Root scripts now use Turbo again after upgrade:
  - Upgraded to `turbo 2.8.9`.
  - Restored `build: turbo build`, `test: turbo test`, and `turbo.json` `test` pipeline task.

## Commits (latest first)
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
- `apps/web/vitest.config.ts`
- `apps/web/src/test/setup.ts`
- `apps/web/src/utils/nearest-loadable.test.ts`
- `apps/web/src/utils/equipment.test.ts`
- `apps/web/src/storage/repo.test.ts`
- `apps/api/vitest.config.ts`
- `apps/api/test/bootstrap.controller.test.ts`
- `apps/api/test/sync.controller.test.ts`

## Notes
- Earlier Turbo `2.8.7` panicked on this machine; `2.8.9` is stable for `turbo build` and `turbo test`.
