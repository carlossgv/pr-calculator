#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
ENV_FILE="$ROOT_DIR/.env.android"
BUMP_TYPE=""

usage() {
  cat <<'EOF'
Usage:
  scripts/build-android-aab.sh [--patch|--minor|--major|--bump <type>] [ENV_FILE]

Options:
  --patch          Bump patch version (x.y.z -> x.y.z+1)
  --minor          Bump minor version (x.y.z -> x.y+1.0)
  --major          Bump major version (x.y.z -> x+1.0.0)
  --bump <type>    Same as above, where type is patch|minor|major
  -h, --help       Show this help

Notes:
  - versionCode is always incremented by 1 when a bump option is provided.
  - ENV_FILE defaults to .env.android
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --patch)
      BUMP_TYPE="patch"
      shift
      ;;
    --minor)
      BUMP_TYPE="minor"
      shift
      ;;
    --major)
      BUMP_TYPE="major"
      shift
      ;;
    --bump)
      if [[ $# -lt 2 ]]; then
        echo "Error: --bump requires one value: patch|minor|major" >&2
        exit 1
      fi
      BUMP_TYPE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      echo "Error: unknown option '$1'" >&2
      usage >&2
      exit 1
      ;;
    *)
      ENV_FILE="$1"
      shift
      ;;
  esac
done

if [[ -n "$BUMP_TYPE" ]] && [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" ]]; then
  echo "Error: invalid bump type '$BUMP_TYPE'. Use patch|minor|major." >&2
  exit 1
fi

if [[ -n "$BUMP_TYPE" ]]; then
  "$ROOT_DIR/scripts/bump-android-version.sh" "--$BUMP_TYPE"
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

cd "$ROOT_DIR/apps/native/android"
./gradlew bundleRelease
