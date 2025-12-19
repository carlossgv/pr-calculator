#!/usr/bin/env bash
set -euo pipefail

OUT="/tmp/boxflow_dump.txt"
: > "$OUT"

add_file () {
  local path="$1"

  if [[ ! -f "$path" ]]; then
    echo "[MISSING FILE] $path" >&2
  fi

  {
    echo
    echo "============================================================"
    echo "FILE: $path"
    echo "============================================================"
    echo
    if [[ -f "$path" ]]; then
      cat "$path"
    else
      echo "[MISSING FILE] $path"
    fi
    echo
  } >> "$OUT"
}

echo "Writing dump to: $OUT"

add_file "apps/web/src/storage/db.ts"
add_file "apps/web/src/storage/repo.ts"
add_file "apps/web/src/storage/changes.ts"
add_file "apps/web/src/storage/backup.ts"
add_file "apps/web/src/sync/api.ts"
add_file "apps/web/src/sync/sync.ts"
add_file "apps/web/src/sync/identity.ts"
add_file "apps/web/src/main.tsx"
add_file "apps/web/vite.config.ts"
add_file "apps/api/src/auth/device-auth.guard.ts"
add_file "apps/api/src/bootstrap.controller.ts"
add_file "apps/api/src/sync.controller.ts"
add_file "apps/api/src/prisma.ts"
add_file "apps/api/prisma/schema.prisma"
add_file "apps/api/package.json"
add_file "apps/web/package.json"
add_file "turbo.json"

echo "DONE ✅  Open the file with:"
echo "  less -R $OUT"
echo
echo "If you want it in clipboard (mac):"
echo "  pbcopy < $OUT"
