// apps/web/src/utils/context.ts
import type { UnitContext } from "@repo/core";
import { t } from "../i18n/strings";

export function contextLabel(ctx: UnitContext): string {
  switch (ctx) {
    case "olympic":
      return t.context.olympic;
    case "crossfit":
      return t.context.crossfit;
    case "custom":
      return t.context.custom;
    default:
      return ctx;
  }
}
