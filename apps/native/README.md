# PR Calculator Native (Capacitor)

This app wraps `apps/web` in a native shell for iOS/Android.

## First-time setup
1. Install deps: `pnpm install`
2. Build web for native: `pnpm --filter @repo/web build:native`
3. Add platforms:
   - iOS: `pnpm --filter @repo/native exec cap add ios`
   - Android: `pnpm --filter @repo/native exec cap add android`
4. Sync web build into native: `pnpm --filter @repo/native sync`
5. Open projects:
   - iOS: `pnpm --filter @repo/native open:ios`
   - Android: `pnpm --filter @repo/native open:android`

## Repeat after web changes
- `pnpm --filter @repo/web build:native`
- `pnpm --filter @repo/native sync`

## Notes
- Native build uses `apps/web/.env.native` with `VITE_API_BASE`.
- Service worker is disabled in native builds.
- Sync runs while the app is open; on resume it triggers a pull.
- Android builds expect JDK 17. If you see Java home errors, check `~/.gradle/gradle.properties`
  and Android Studio’s Gradle JDK setting.

## Live updates (Capawesome)
1. Install dependency: `pnpm -C apps/native add @capawesome/capacitor-live-update`
2. Set env vars used by `apps/native/capacitor.config.ts`:
   - `CAPAWESOME_APP_ID` (Capawesome Cloud app id)
   - `CAPAWESOME_CHANNEL` (default: `production`)
3. Sync native projects: `pnpm --filter @repo/native sync`
4. Build web assets: `pnpm --filter @repo/web build`
5. Upload bundle: `npx @capawesome/cli apps:liveupdates:upload`

Notes:
- `autoUpdateStrategy: "background"` checks at startup and on resume (after 15 min).
- `readyTimeout` + `LiveUpdate.ready()` enable automatic rollback protection.
