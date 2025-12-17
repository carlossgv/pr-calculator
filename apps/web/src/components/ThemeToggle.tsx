// apps/web/src/components/ThemeToggle.tsx
import { Moon, Sun } from "lucide-react";
import type { ResolvedTheme } from "../theme/theme";

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
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light" : "Dark"}
      type="button"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
