#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

cd "$ROOT_DIR"

echo "Building web app for native..."
pnpm --filter @repo/web build:native

echo "Syncing Capacitor native projects..."
pnpm --filter @repo/native sync

cat <<'EOF'

Native sync complete.

Next steps:
- Open Android project: pnpm --filter @repo/native open:android
- Open iOS project: pnpm --filter @repo/native open:ios

To bump the Android app version without building locally, run:
- ./scripts/bump-android-version.sh --patch
- ./scripts/bump-android-version.sh --minor
- ./scripts/bump-android-version.sh --major

To bump the version and build a release bundle locally, run:
- ./scripts/build-android-aab.sh --patch
- ./scripts/build-android-aab.sh --minor
- ./scripts/build-android-aab.sh --major
EOF
