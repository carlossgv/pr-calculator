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

add_file "apps/web/src/global.css"

echo "DONE ✅  Open the file with:"
echo "  less -R $OUT"
echo
echo "If you want it in clipboard (mac):"
echo "  pbcopy < $OUT"
