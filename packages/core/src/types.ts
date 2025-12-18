// packages/core/src/types.ts
export type Unit = "kg" | "lb";

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
  createdAt: string; // ISO
};

export type PrEntry = {
  id: string;
  movementId: string;
  weight: number;
  reps: number;
  date: string; // ISO (fecha del PR)
  createdAt: string; // ISO (cuando se creó el registro)
  updatedAt: string; // ISO (última edición del registro)
};

export type UnitContext = "olympic" | "crossfit" | "custom";

export type ThemePreference = "light" | "dark";

export type UserPreferences = {
  defaultUnit: Unit;
  contexts: Record<Unit, UnitContext>;

  theme: ThemePreference;

  bar: Plate;
  rounding: Weight;
  plates: Plate[];
};
