#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
ANDROID_GRADLE_FILE=${ANDROID_GRADLE_FILE:-"$ROOT_DIR/apps/native/android/app/build.gradle"}

usage() {
  cat <<'EOF'
Usage:
  scripts/bump-android-version.sh --patch|--minor|--major

Options:
  --patch      Bump patch version (x.y.z -> x.y.z+1)
  --minor      Bump minor version (x.y.z -> x.y+1.0)
  --major      Bump major version (x.y.z -> x+1.0.0)
  -h, --help   Show this help

versionCode is always incremented by 1.
EOF
}

if [[ $# -ne 1 ]]; then
  usage >&2
  exit 1
fi

case "$1" in
  --patch)
    BUMP_TYPE="patch"
    ;;
  --minor)
    BUMP_TYPE="minor"
    ;;
  --major)
    BUMP_TYPE="major"
    ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    echo "Error: invalid bump option '$1'. Use --patch, --minor, or --major." >&2
    usage >&2
    exit 1
    ;;
esac

current_version_name=$(
  sed -nE 's/^[[:space:]]*versionName[[:space:]]+"([0-9]+\.[0-9]+\.[0-9]+)".*$/\1/p' "$ANDROID_GRADLE_FILE" | head -n1
)
current_version_code=$(
  sed -nE 's/^[[:space:]]*versionCode[[:space:]]+([0-9]+).*$/\1/p' "$ANDROID_GRADLE_FILE" | head -n1
)

if [[ -z "$current_version_name" || -z "$current_version_code" ]]; then
  echo "Error: could not parse versionName/versionCode from $ANDROID_GRADLE_FILE" >&2
  exit 1
fi

IFS='.' read -r major minor patch <<< "$current_version_name"
case "$BUMP_TYPE" in
  major)
    major=$((major + 1))
    minor=0
    patch=0
    ;;
  minor)
    minor=$((minor + 1))
    patch=0
    ;;
  patch)
    patch=$((patch + 1))
    ;;
esac

next_version_name="${major}.${minor}.${patch}"
next_version_code=$((current_version_code + 1))

perl -i -pe '
  s/^(\s*versionCode\s+)\d+(\s*)$/${1}'"$next_version_code"'${2}/;
  s/^(\s*versionName\s+")\d+\.\d+\.\d+(".*)$/${1}'"$next_version_name"'${2}/;
' "$ANDROID_GRADLE_FILE"

echo "Bumped Android version: $current_version_name ($current_version_code) -> $next_version_name ($next_version_code)"

cat <<EOF

Next steps:
  1. Review and commit the version bump:
     git diff -- apps/native/android/app/build.gradle
     git add apps/native/android/app/build.gradle
     git commit -m "chore: bump android version to $next_version_name"

  2. Push this branch, open a pull request, and merge it into main:
     git push -u origin <your-branch>

  3. After the pull request is merged, update main:
     git checkout main
     git pull --ff-only origin main

  4. Tag the merged commit to start the Android Release workflow:
     git tag -a v$next_version_name -m "Android v$next_version_name"
     git push origin v$next_version_name

The tag must match versionName exactly: $next_version_name -> v$next_version_name
EOF
