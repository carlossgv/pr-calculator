// FILE: apps/web/src/ui/Modal.tsx
import type { ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./Modal.module.css";
import { Button } from "./Button";

type Props = {
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  ariaLabel?: string;
};

export function Modal({ title, children, onClose, ariaLabel }: Props) {
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
      <section className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>

          <Button
            variant="ghost"
            shape="round"
            iconOnly
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </Button>
        </div>

        <div className={styles.body}>{children}</div>
      </section>
    </div>
  );
}
