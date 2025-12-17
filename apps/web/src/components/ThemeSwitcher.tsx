
// apps/web/src/components/ThemeSwitcher.tsx
import type { ThemePreference } from "@repo/core";

type Props = {
  value: ThemePreference;
  onChange: (v: ThemePreference) => void;
};

export function ThemeSwitcher({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ThemePreference)}
      style={{ width: "auto" }}
      aria-label="Theme"
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
