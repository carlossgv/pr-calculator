#!/usr/bin/env bash
set -euo pipefail

# ✅ Enable recursive globbing (**) and sane glob behavior
shopt -s globstar nullglob

add_file () {
  local pattern="$1"
  local matches=()

  matches=( $pattern )

  # If no glob match, keep literal so we can report MISSING
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
  done
}

# ------------------------------------------------------------
# Output
# ------------------------------------------------------------

add_file "apps/web/src/components/WeightCalculatorPanel.tsx"
add_file "apps/web/src/pages/HomePage.tsx"
add_file "apps/web/src/pages/MovementCalculatorPage.tsx"
add_file "apps/web/src/router.tsx"
add_file "apps/web/src/storage/repo.ts"
add_file "apps/web/src/storage/db.ts"
add_file "apps/web/src/utils/context.ts"
add_file "apps/web/src/ui/AppLayout.tsx"
add_file "apps/web/src/storage/changes.ts"

# If running interactively (no pipe), give a hint
if [[ -t 1 ]]; then
  echo "DONE ✅"
  echo
  echo "Tip:"
  echo "  ./dump.sh | pbcopy        # copy to clipboard (macOS)"
  echo "  ./dump.sh > dump.txt      # save to file"
fi
