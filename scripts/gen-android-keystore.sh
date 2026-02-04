#!/usr/bin/env bash
set -euo pipefail

KEYSTORE_NAME=${1:-prcalc-release.keystore}
ALIAS=${2:-prcalc}

if command -v keytool >/dev/null 2>&1; then
  keytool -genkeypair -v \
    -keystore "$KEYSTORE_NAME" \
    -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000
else
  echo "keytool not found. Install a JDK (17 recommended) and try again." >&2
  exit 1
fi
