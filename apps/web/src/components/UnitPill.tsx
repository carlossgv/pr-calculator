// apps/web/src/components/UnitPill.tsx
import type { Unit } from "@repo/core";

type Props = {
  value: Unit;
  onChange: (next: Unit) => void;
  disabled?: boolean;
};

export function UnitPill({ value, onChange, disabled }: Props) {
  return (
    <button
      type="button"
      className="unitPill"
      disabled={disabled}
      onClick={() => onChange(value === "kg" ? "lb" : "kg")}
      aria-label={`Toggle unit (current ${value.toUpperCase()})`}
      title="Toggle unit"
    >
      {value.toUpperCase()}
    </button>
  );
}
