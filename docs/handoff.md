# Handoff

Date: 2026-02-03
Branch: main

## Summary
- Added PWA install guide in Preferences (iOS/Android/Desktop), with beforeinstallprompt handling and installed state.
- Reorganized Preferences sections: UI (language/theme), Presets (bar + presets), Backup, Install, Support (ID + contact), Support PR Calc (Ko-fi).
- Added Ko-fi button (official image) with localized copy in its own section.
- Updated deploy workflow: env-based API_URL, TS_LOGIN_SERVER, DEPLOY_PATH, dev/prod compose files, and NTFY_URL var.

## Files touched
- apps/web/src/pages/PreferencesPage.tsx
- apps/web/src/pages/PreferencesPage.module.css
- apps/web/src/i18n/strings.en.ts
- apps/web/src/i18n/strings.es.ts
- .github/workflows/build-push-deploy.yml

## Decisions
- Separated user support from app support: Support section holds ID + contact; Ko-fi is “Support PR Calc.”
- Install help is OS-aware with inline CTA only when beforeinstallprompt is available.
- Workflow now reads env-specific vars (API_URL, TS_LOGIN_SERVER, DEPLOY_PATH, NTFY_URL).

## Workflow checklist
- Environments: `staging`, `production`
- Secrets (env-scoped): `TS_AUTHKEY`, `NTFY_TOKEN`
- Vars (env-scoped): `API_URL`, `TS_LOGIN_SERVER`, `DEPLOY_HOST_TS`, `DEPLOY_PATH`, `SERVER_USER`, `NTFY_URL`

## TODO (next)
- Debug Headscale/Tailscale SSH: confirm ACL allows `tag:github-actions` → deploy host tag, and `SERVER_USER` permissions; verify `DEPLOY_HOST_TS` and tags on the target host.

## User feedback (2026-02-05)
- Add an explicit close “X” button to modals; some users don’t realize they can tap outside to close.
- On some Android devices there is a visible empty gap between the bottom button bar and the system keyboard/navigation area.
- Creating and adding new PRs and movements is confusing; improve the flow and clarity.
