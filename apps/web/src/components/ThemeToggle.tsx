
// apps/web/src/components/ThemeToggle.tsx
import type { ResolvedTheme } from "../theme/theme";

type Props = {
  value: ResolvedTheme;
  onToggle: () => void;
};

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 18a6 6 0 1 1 0-12a6 6 0 0 1 0 12Zm0-16a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 18a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4 11a1 1 0 0 1 1 1a1 1 0 1 1-1-1Zm16 0a1 1 0 0 1 1 1a1 1 0 1 1-1-1ZM5.64 5.64a1 1 0 0 1 1.41 0l.71.7a1 1 0 1 1-1.41 1.42l-.71-.71a1 1 0 0 1 0-1.41Zm11.3 11.3a1 1 0 0 1 1.41 0l.71.7a1 1 0 0 1-1.41 1.42l-.71-.71a1 1 0 0 1 0-1.41ZM18.36 5.64a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.42l.7-.7a1 1 0 0 1 1.42 0ZM7.76 17.24a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.42l.71-.7a1 1 0 0 1 1.41 0Z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5Z"
      />
    </svg>
  );
}

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
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
