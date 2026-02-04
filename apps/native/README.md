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
