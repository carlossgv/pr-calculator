// FILE: apps/web/src/ui/Modal.tsx
import type { ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./Modal.module.css";
import { Button } from "./Button";

type Props = {
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
  ariaLabel?: string;
  className?: string;
};

export function Modal({
  title,
  children,
  onClose,
  closeLabel,
  ariaLabel,
  className,
}: Props) {
  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={typeof ariaLabel === "string" ? ariaLabel : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={[styles.modal, className].filter(Boolean).join(" ")}
      >
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>

          <Button
            variant="ghost"
            shape="round"
            iconOnly
            className={styles.close}
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
          >
            <X size={18} />
          </Button>
        </div>

        <div className={styles.body}>{children}</div>
      </section>
    </div>
  );
}
