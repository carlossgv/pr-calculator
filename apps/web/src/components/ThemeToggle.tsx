// apps/web/src/components/ThemeToggle.tsx
import { Moon, Sun } from "lucide-react";
import type { ResolvedTheme } from "../theme/theme";
import { t } from "../i18n/strings";

type Props = {
  value: ResolvedTheme;
  onToggle: () => void;
};

export function ThemeToggle({ value, onToggle }: Props) {
  const isDark = value === "dark";

  return (
    <button
      onClick={onToggle}
      className="iconButton"
      aria-label={
        isDark
          ? t.prefs.theme.switchToLightAria
          : t.prefs.theme.switchToDarkAria
      }
      title={isDark ? t.prefs.theme.lightTitle : t.prefs.theme.darkTitle}
      type="button"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
