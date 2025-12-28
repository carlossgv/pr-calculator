// packages/core/src/types.ts
export type Unit = "kg" | "lb";
export type Language = "en" | "es";

export type Weight = {
  value: number;
  unit: Unit;
};

export type Plate = {
  value: number;
  unit: Unit;
  label?: string; // ej: "45 lb", "2.5 kg"
};

export type Movement = {
  id: string;
  name: string;

  createdAt: string;

  /** Para sync + orden y tombstones */
  updatedAt: string;

  /** Soft delete */
  deletedAt?: string | null;
};

export type PrEntry = {
  id: string;
  movementId: string;

  weight: number;
  reps: number;
  date: string;

  createdAt: string;
  updatedAt: string;

  /** Soft delete */
  deletedAt?: string | null;
};

export type UnitContext = "olympic" | "crossfit" | "custom";

export type ThemePreference = "light" | "dark";

export type UserPreferences = {
  language: Language;
  defaultUnit: Unit;
  contexts: Record<Unit, UnitContext>;

  theme: ThemePreference;

  bar: Plate;
  rounding: Weight;
  plates: Plate[];
};
