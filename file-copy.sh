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

add_file "apps/web/src/pages/MovementsPage.tsx"
add_file "apps/web/src/pages/MovementDetailsPage.tsx"
add_file "apps/web/src/pages/MovementDetailsPage.module.css"
add_file "apps/web/src/storage/repo.ts"
add_file "apps/web/src/router.tsx"
add_file "apps/web/src/i18n/strings.ts"
add_file "apps/web/src/i18n/strings.en.ts"
add_file "apps/web/src/ui/AppLayout.tsx"

add_file "apps/web/src/pages/PreferencesPage.tsx"
add_file "apps/web/src/pages/PreferencesPage.module.css"
add_file "apps/web/src/components/Switch.tsx"
add_file "apps/web/src/components/ThemeToggle.tsx"
add_file "apps/web/src/components/ThemeSwitcher.tsx"
add_file "apps/web/src/theme/theme.ts"

add_file "apps/web/src/global.css"
add_file "apps/web/src/components/WeightCalculatorPanel.module.css"

echo "DONE ✅  Open the file with:"
echo "  less -R $OUT"
echo
echo "If you want it in clipboard (mac):"
echo "  pbcopy < $OUT"
