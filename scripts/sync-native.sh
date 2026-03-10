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

If you want to bump the Android app version and build a release bundle, run:
- ./scripts/build-android-aab.sh --patch
- ./scripts/build-android-aab.sh --minor
- ./scripts/build-android-aab.sh --major
EOF
