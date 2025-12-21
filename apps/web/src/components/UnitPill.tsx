// FILE: apps/web/src/components/UnitPill.tsx
import type { Unit } from "@repo/core";
import { Button } from "../ui/Button";

type Props = {
  value: Unit;
  onChange: (next: Unit) => void;
  disabled?: boolean;
};

export function UnitPill({ value, onChange, disabled }: Props) {
  return (
    <Button
      size="sm"
      variant="outline"
      shape="pill"
      disabled={disabled}
      onClick={() => onChange(value === "kg" ? "lb" : "kg")}
      aria-label={`Toggle unit (current ${value.toUpperCase()})`}
      title="Toggle unit"
    >
      {value.toUpperCase()}
    </Button>
  );
}
