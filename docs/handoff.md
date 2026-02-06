# Handoff

Date: 2026-02-06
Branch: main

## Summary
- Fixed preset unit change: PR weights now convert when default unit switches (previously only the unit label changed).
- Movements list label now shows `weight unit × reps`.
- Prevented hero input and percent tiles from causing horizontal overflow; input shrinks only when it truly overflows.
- Removed the `(MAX)` text from the 100% percent tile (color-only highlight now).
- Fixed TS build error in native build (`window.setTimeout` -> `setTimeout`).

## Files touched
- apps/web/src/pages/PreferencesPage.tsx
- apps/web/src/storage/repo.ts
- apps/web/src/pages/MovementsPage.tsx
- apps/web/src/components/WeightCalculatorPanel.tsx
- apps/web/src/components/WeightCalculatorPanel.module.css
- apps/web/src/components/PercentCards.tsx
- apps/web/src/components/PercentCards.module.css

## Decisions
- PR entry weights are stored in the default unit; when default unit changes via presets we now bulk-convert stored PR weights.
- Overflow handling is done via actual overflow measurement for the hero input; percent tile targets shrink by length.

## Workflow checklist
- Environments: `staging`, `production`
- Secrets (env-scoped): `TS_AUTHKEY`, `NTFY_TOKEN`
- Vars (env-scoped): `API_URL`, `TS_LOGIN_SERVER`, `DEPLOY_HOST_TS`, `DEPLOY_PATH`, `SERVER_USER`, `NTFY_URL`

## TODO (next)
- Native app: when keyboard is open and user scrolls, bottom nav bar lifts and leaves a gap above the keyboard (Android-only so far; iOS looks OK). Decide whether to pin bar to keyboard or hide while keyboard is open. Needs repro in Android Studio emulator.
- Debug Headscale/Tailscale SSH: confirm ACL allows `tag:github-actions` → deploy host tag, and `SERVER_USER` permissions; verify `DEPLOY_HOST_TS` and tags on the target host.

## User feedback (2026-02-05)
- Add an explicit close “X” button to modals; some users don’t realize they can tap outside to close.
- On some Android devices there is a visible empty gap between the bottom button bar and the system keyboard/navigation area.
- Creating and adding new PRs and movements is confusing; improve the flow and clarity.

## Native build notes
- iOS simulator verified OK.
- Android emulator: need to disable `Enable keyboard input` to show software keyboard (Android Studio Ladybug 2024.2.1 on macOS).
