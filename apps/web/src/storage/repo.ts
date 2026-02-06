// FILE: apps/web/src/storage/repo.ts
import {
  convertWeightValue,
  DEFAULT_PREFS,
  type Movement,
  type PrEntry,
  type UserPreferences,
} from "@repo/core";
import Dexie from "dexie";
import { db } from "./db";
import { markDirty } from "./changes";

function isNewPrefsShape(p: unknown): p is UserPreferences {
  const v = p as any;
  return Boolean(
    v &&
      typeof v === "object" &&
      (v.defaultUnit === "kg" || v.defaultUnit === "lb") &&
      v.bar &&
      typeof v.bar.value === "number" &&
      (v.bar.unit === "kg" || v.bar.unit === "lb") &&
      Array.isArray(v.plates),
  );
}

function nowIso() {
  return new Date().toISOString();
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function isDeleted(row: { deletedAt?: string | null } | null | undefined) {
  return Boolean(row && row.deletedAt);
}

type Unit = "kg" | "lb";
type PercentOrder = "asc" | "desc";

function sortPcts(pcts: number[], order: PercentOrder): number[] {
  const dir = order === "asc" ? 1 : -1;
  return [...pcts].sort((a, b) => (a - b) * dir);
}

type QuickCalcDraft = {
  v: 1;
  unit: Unit;
  weight: number;
  customPcts: number[];
  updatedAt: string;
};

function sanitizeQuickDraft(x: any): QuickCalcDraft | null {
  if (!x || typeof x !== "object") return null;
  if (x.v !== 1) return null;

  const unit: Unit = x.unit === "lb" ? "lb" : "kg";
  const weight = Number(x.weight);
  const safeWeight = Number.isFinite(weight) ? weight : 100;
  const customPctsRaw = Array.isArray(x.customPcts) ? x.customPcts : [];
  const customPcts: number[] = [];
  for (const v of customPctsRaw) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    const p = Math.round(n * 10) / 10;
    if (p <= 0 || p > 300) continue;
    if (customPcts.some((k) => Math.abs(k - p) < 0.0001)) continue;
    customPcts.push(p);
  }

  return {
    v: 1,
    unit,
    weight: safeWeight,
    customPcts: sortPcts(customPcts, "desc").slice(0, 8),
    updatedAt: typeof x.updatedAt === "string" ? x.updatedAt : nowIso(),
  };
}

type PercentOrderRow = {
  v: 1;
  order: PercentOrder;
  updatedAt: string;
};

function sanitizePercentOrder(x: any): PercentOrderRow | null {
  if (!x || typeof x !== "object") return null;
  if (x.v !== 1) return null;
  const order: PercentOrder = x.order === "asc" ? "asc" : "desc";
  return {
    v: 1,
    order,
    updatedAt: typeof x.updatedAt === "string" ? x.updatedAt : nowIso(),
  };
}

type LastRouteRow = {
  v: 1;
  path: string; // "/movements/..../calc/kg/100?x=y#hash"
  updatedAt: string;
};

function sanitizeLastRoute(x: any): LastRouteRow | null {
  if (!x || typeof x !== "object") return null;
  if (x.v !== 1) return null;
  const path = String(x.path ?? "");
  if (!path.startsWith("/")) return null;
  if (path.length > 500) return null; // safety
  return {
    v: 1,
    path,
    updatedAt: typeof x.updatedAt === "string" ? x.updatedAt : nowIso(),
  };
}

export const repo = {
  async getPreferences(): Promise<UserPreferences> {
    const row = await db.preferences.get("prefs");
    const value = (row as any)?.value;

    if (isNewPrefsShape(value)) {
      const contexts = value.contexts ?? { kg: "olympic", lb: "crossfit" };
      const theme = value.theme ?? "dark";

      const language =
        value.language === "es" || value.language === "en" ? value.language : "en";

      if (!value.contexts || !value.theme || !value.language) {
        const next: UserPreferences = { ...value, contexts, theme, language };
        await db.preferences.put({ id: "prefs", value: next });
        markDirty();
        return next;
      }

      return value;
    }

    await db.preferences.put({ id: "prefs", value: DEFAULT_PREFS });
    markDirty();
    return DEFAULT_PREFS;
  },

  async setPreferences(prefs: UserPreferences): Promise<void> {
    await db.preferences.put({ id: "prefs", value: prefs });
    markDirty();
  },

  async convertPrEntriesUnit(from: Unit, to: Unit): Promise<void> {
    if (from === to) return;

    const rows = await db.prEntries.toArray();
    if (!rows.length) return;

    const now = nowIso();
    let changed = false;

    const next = rows.map((e) => {
      const weight = Number(e.weight);
      if (!Number.isFinite(weight)) return e;

      const converted = round1(convertWeightValue(weight, from, to));
      if (converted === weight) return e;

      changed = true;
      return {
        ...(e as any),
        weight: converted,
        updatedAt: now,
      } as PrEntry;
    });

    if (!changed) return;

    await db.prEntries.bulkPut(next);
    markDirty();
  },

  // ============================================================
  // Quick calculator draft (LOCAL ONLY, no sync)
  // ============================================================

  async getQuickCalculatorDraft(): Promise<{
    unit: Unit;
    weight: number;
    customPcts: number[];
  } | null> {
    const row = await db.meta.get("quickCalcDraft");
    const draft = sanitizeQuickDraft((row as any)?.value);
    if (!draft) return null;

    return {
      unit: draft.unit,
      weight: draft.weight,
      customPcts: draft.customPcts,
    };
  },

  async setQuickCalculatorDraft(
    draft: { unit: Unit; weight: number; customPcts: number[] } | null,
  ): Promise<void> {
    if (!draft) {
      await db.meta.delete("quickCalcDraft");
      return;
    }

    const next: QuickCalcDraft = {
      v: 1,
      unit: draft.unit === "lb" ? "lb" : "kg",
      weight: Number.isFinite(Number(draft.weight)) ? Number(draft.weight) : 100,
      customPcts: Array.isArray(draft.customPcts)
        ? sortPcts(
            draft.customPcts
              .map((x) => Math.round(Number(x) * 10) / 10)
              .filter((x) => Number.isFinite(x) && x > 0 && x <= 300)
              .filter(
                (x, i, arr) =>
                  arr.findIndex((y) => Math.abs(y - x) < 0.0001) === i,
              ),
            "desc",
          ).slice(0, 8)
        : [],
      updatedAt: nowIso(),
    };

    await db.meta.put({ id: "quickCalcDraft", value: next });
  },

  // ============================================================
  // Last route (LOCAL ONLY, used for "resume where you were")
  // ============================================================

  async getLastRoute(): Promise<string | null> {
    const row = await db.meta.get("lastRoute");
    const v = sanitizeLastRoute((row as any)?.value);
    return v?.path ?? null;
  },

  async getPercentOrder(): Promise<PercentOrder> {
    const row = await db.meta.get("percentOrder");
    const v = sanitizePercentOrder((row as any)?.value);
    return v?.order ?? "desc";
  },

  async setPercentOrder(order: PercentOrder): Promise<void> {
    const next: PercentOrderRow = {
      v: 1,
      order: order === "asc" ? "asc" : "desc",
      updatedAt: nowIso(),
    };
    await db.meta.put({ id: "percentOrder", value: next });
  },

  async setLastRoute(path: string): Promise<void> {
    const p = String(path ?? "");
    if (!p.startsWith("/")) return;
    if (p.length > 500) return;

    const next: LastRouteRow = { v: 1, path: p, updatedAt: nowIso() };
    await db.meta.put({ id: "lastRoute", value: next });
  },

  async listMovements(): Promise<Movement[]> {
    const rows = await db.movements.orderBy("createdAt").reverse().toArray();
    return rows.filter((m) => !isDeleted(m));
  },

  async getMovement(id: string): Promise<Movement | null> {
    const m = (await db.movements.get(id)) ?? null;
    if (!m || isDeleted(m)) return null;
    return m;
  },

  async upsertMovement(m: Movement): Promise<void> {
    const now = nowIso();

    const next: Movement = {
      ...(m as any),
      updatedAt: (m as any).updatedAt ?? now,
      deletedAt: (m as any).deletedAt ?? null,
    };

    await db.movements.put(next);
    markDirty();
  },

  async deleteMovement(id: string): Promise<void> {
    const now = nowIso();
    const m = await db.movements.get(id);
    if (!m) return;

    await db.movements.put({ ...(m as any), deletedAt: now, updatedAt: now });

    const prs = await db.prEntries.where("movementId").equals(id).toArray();
    if (prs.length) {
      await db.prEntries.bulkPut(
        prs.map((e) => ({
          ...(e as any),
          deletedAt: now,
          updatedAt: now,
        })),
      );
    }

    markDirty();
  },

  async listPrEntries(movementId: string): Promise<PrEntry[]> {
    const rows = await db.prEntries
      .where("[movementId+updatedAt]")
      .between([movementId, Dexie.minKey], [movementId, Dexie.maxKey])
      .reverse()
      .toArray();

    return rows.filter((e) => !isDeleted(e));
  },

  async addPrEntry(e: PrEntry): Promise<void> {
    const now = nowIso();
    const next: PrEntry = {
      ...(e as any),
      updatedAt: (e as any).updatedAt ?? now,
      deletedAt: (e as any).deletedAt ?? null,
    };
    await db.prEntries.put(next);
    markDirty();
  },

  async upsertPrEntry(e: PrEntry): Promise<void> {
    const now = nowIso();
    const next: PrEntry = {
      ...(e as any),
      updatedAt: (e as any).updatedAt ?? now,
      deletedAt: (e as any).deletedAt ?? null,
    };
    await db.prEntries.put(next);
    markDirty();
  },

  async deletePrEntry(id: string): Promise<void> {
    const now = nowIso();
    const e = await db.prEntries.get(id);
    if (!e) return;
    await db.prEntries.put({ ...(e as any), deletedAt: now, updatedAt: now });
    markDirty();
  },
};
