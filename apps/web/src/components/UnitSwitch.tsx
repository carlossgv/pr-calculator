// apps/web/src/components/UnitSwitch.tsx
import type { Unit } from "@repo/core";

type Props = {
  value: Unit;
  onChange: (next: Unit) => void;
  disabled?: boolean;
};

export function UnitSwitch({ value, onChange, disabled }: Props) {
  const checked = value === "lb";

  return (
    <button
      type="button"
      className="unitSwitch"
      role="switch"
      aria-checked={checked}
      aria-label="Unit"
      disabled={disabled}
      onClick={() => onChange(checked ? "kg" : "lb")}
    >
      <span className="unitSwitch__track" aria-hidden="true">
        <span className="unitSwitch__labels">
          <span className="unitSwitch__label">KG</span>
          <span className="unitSwitch__label">LB</span>
        </span>
        <span className="unitSwitch__thumb" />
      </span>
    </button>
  );
}
