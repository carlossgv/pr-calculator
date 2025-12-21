// FILE: apps/web/src/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant =
  | "solid"
  | "outline"
  | "ghost"
  | "danger"
  | "row"
  | "primary"
  | "neutral";

type Size = "sm" | "md" | "lg";
type Shape = "default" | "pill" | "round";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  shape?: Shape;
  fullWidth?: boolean;
  iconOnly?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  /** Convenience prop used across the app (maps to aria-label). */
  ariaLabel?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "outline",
  size = "md",
  shape = "default",
  fullWidth,
  iconOnly,
  leftIcon,
  rightIcon,
  ariaLabel,
  className,
  children,
  type,
  ...rest
}: ButtonProps) {
  const resolvedVariant =
    variant === "primary" ? "solid" : variant === "neutral" ? "outline" : variant;

  const shapeClass =
    shape === "pill"
      ? styles.pill
      : shape === "round"
        ? styles.round
        : styles.defaultShape;

  const sizeClass =
    size === "sm" ? styles.sm : size === "lg" ? styles.lg : styles.md;

  const classes = cx(
    styles.base,
    styles[resolvedVariant],
    sizeClass,
    shapeClass,
    fullWidth && styles.fullWidth,
    iconOnly && styles.iconOnly,
    className,
  );

  const hasSideIcons = Boolean(leftIcon) || Boolean(rightIcon);

  // ✅ iconOnly: allow <Button iconOnly><X /></Button>
  // - If left/right icons exist, render those.
  // - Otherwise treat children as the icon node (NOT as label).
  const iconOnlyIcon = iconOnly && !hasSideIcons ? children : null;

  // ✅ IMPORTANT:
  // For variant="row", children are often complex layout (divs).
  // Wrapping them in a <span> breaks layout (div-inside-span).
  const shouldWrapChildrenAsLabel = !iconOnly && resolvedVariant !== "row";

  return (
    <button
      type={type ?? "button"}
      className={classes}
      aria-label={ariaLabel}
      {...rest}
    >
      {leftIcon ? <span className={styles.icon}>{leftIcon}</span> : null}

      {iconOnlyIcon ? (
        <span className={styles.icon} aria-hidden="true">
          {iconOnlyIcon}
        </span>
      ) : null}

      {iconOnly ? null : shouldWrapChildrenAsLabel ? (
        children ? <span className={styles.label}>{children}</span> : null
      ) : (
        children
      )}

      {rightIcon ? <span className={styles.icon}>{rightIcon}</span> : null}
    </button>
  );
}
