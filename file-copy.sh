#!/usr/bin/env bash
set -euo pipefail

OUT="/tmp/boxflow_dump.txt"
: > "$OUT"

# ✅ Enable recursive globbing (**) and sane glob behavior
shopt -s globstar nullglob

add_file () {
  local pattern="$1"
  local matches=()

  # Expand glob patterns safely into an array.
  # With nullglob, non-matching globs expand to nothing (not the raw pattern).
  matches=( $pattern )

  # If it's a literal path (no glob chars) and doesn't exist, keep it as-is so we print MISSING.
  if [[ ${#matches[@]} -eq 0 ]]; then
    matches=( "$pattern" )
  fi

  # De-duplicate while keeping order
  local seen=" "
  local path
  for path in "${matches[@]}"; do
    if [[ "$seen" == *" $path "* ]]; then
      continue
    fi
    seen+=" $path "

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
  done
}

echo "Writing dump to: $OUT"

add_file "apps/api/prisma.config.ts"
add_file "apps/api/prisma/schema.prisma"
add_file "apps/api/src/prisma.ts"

echo "DONE ✅  Open the file with:"
echo "  less -R $OUT"
echo
echo "If you want it in clipboard (mac):"
echo "  pbcopy < $OUT"
