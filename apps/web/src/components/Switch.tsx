// apps/web/src/components/Switch.tsx
type Props = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
};

export function Switch({
  checked,
  onCheckedChange,
  ariaLabel,
  disabled,
}: Props) {
  return (
    <button
      type="button"
      className="appSwitch"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="appSwitch__track" aria-hidden="true">
        <span className="appSwitch__thumb" />
      </span>
    </button>
  );
}
