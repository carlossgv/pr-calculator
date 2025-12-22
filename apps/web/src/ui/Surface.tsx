// FILE: apps/web/src/ui/Surface.tsx
import type { ReactNode } from "react";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./Surface.module.css";

type Variant = "panel" | "card" | "flat";

type SurfaceProps = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"section">, "className" | "children">;

export function Surface({
  variant = "card",
  className,
  children,
  ...rest
}: SurfaceProps) {
  const variantClass =
    variant === "panel"
      ? styles.panel
      : variant === "flat"
        ? styles.flat
        : styles.card;

  return (
    <section
      className={[styles.base, variantClass, className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </section>
  );
}

type SurfaceHeaderProps = {
  leftLabel?: ReactNode;
  rightChip?: ReactNode;
  showBarcode?: boolean;
};

export function SurfaceHeader({
  leftLabel,
  rightChip,
  showBarcode,
}: SurfaceHeaderProps) {
  return (
    <div className={styles.headerBlock}>
      <div className={styles.header}>
        <div className={styles.leftLabel}>{leftLabel ?? null}</div>
        <div className={styles.rightChip}>{rightChip ?? null}</div>
      </div>

      {showBarcode ? <div className={styles.barcodeRule} /> : null}
    </div>
  );
}

type ChipProps = {
  children: ReactNode;
  tone?: "accent" | "accent2" | "accent3" | "neutral";
};

export function Chip({ children, tone = "neutral" }: ChipProps) {
  const toneClass =
    tone === "accent"
      ? styles.chipAccent
      : tone === "accent2"
        ? styles.chipAccent2
        : tone === "accent3"
          ? styles.chipAccent3
          : styles.chipNeutral;

  return <span className={[styles.chip, toneClass].join(" ")}>{children}</span>;
}

type StickerProps = {
  children: ReactNode;
  stamp?: ReactNode;
};

export function Sticker({ children, stamp }: StickerProps) {
  return (
    <span className={styles.sticker}>
      {children}
      {stamp ? <span className={styles.stamp}>{stamp}</span> : null}
    </span>
  );
}

type ActionVariant = "primary" | "ghost" | "danger";

type ActionButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: ActionVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  title?: string;
};

export function ActionButton({
  children,
  onClick,
  type = "button",
  variant = "ghost",
  fullWidth,
  disabled,
  ariaLabel,
  title,
}: ActionButtonProps) {
  const variantClass =
    variant === "primary"
      ? styles.btnPrimary
      : variant === "danger"
        ? styles.btnDanger
        : styles.btnGhost;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className={[
        styles.btn,
        variantClass,
        fullWidth ? styles.btnFull : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

type IconButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "neutral" | "danger";
  disabled?: boolean;
  ariaLabel: string;
  title?: string;
};

export function IconButton({
  children,
  onClick,
  variant = "neutral",
  disabled,
  ariaLabel,
  title,
}: IconButtonProps) {
  const v = variant === "danger" ? styles.iconBtnDanger : styles.iconBtn;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className={[styles.iconBtnBase, v].join(" ")}
    >
      {children}
    </button>
  );
}
