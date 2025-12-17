
// apps/web/src/components/ContextBadge.tsx
import type { UnitContext } from "@repo/core";
import { contextLabel } from "../utils/context";
import { t } from "../i18n/strings";

type Props = {
  context: UnitContext;
};

export function ContextBadge({ context }: Props) {
  return (
    <span
style={{
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--card-bg)",
  whiteSpace: "nowrap",
}}
    >
      {t.context.label}: {contextLabel(context)}
    </span>
  );
}
