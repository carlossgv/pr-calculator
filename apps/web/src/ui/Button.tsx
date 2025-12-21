// FILE: apps/web/src/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "solid" | "outline" | "ghost" | "danger" | "row";
type Size = "sm" | "md";
type Shape = "default" | "pill" | "round";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  shape?: Shape;
  fullWidth?: boolean;
  iconOnly?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
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
  className,
  children,
  type,
  ...rest
}: ButtonProps) {
  const shapeClass =
    shape === "pill"
      ? styles.pill
      : shape === "round"
        ? styles.round
        : styles.defaultShape;

  const sizeClass = size === "sm" ? styles.sm : styles.md;

  const classes = cx(
    styles.base,
    styles[variant],
    sizeClass,
    shapeClass,
    fullWidth && styles.fullWidth,
    iconOnly && styles.iconOnly,
    className,
  );

  return (
    <button type={type ?? "button"} className={classes} {...rest}>
      {leftIcon ? <span className={styles.icon}>{leftIcon}</span> : null}
      {children ? <span className={styles.label}>{children}</span> : null}
      {rightIcon ? <span className={styles.icon}>{rightIcon}</span> : null}
    </button>
  );
}
