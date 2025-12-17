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

export type UserPreferences = {
  defaultUnit: Unit;
  contexts: Record<Unit, UnitContext>;

  bar: Plate;
  rounding: Weight;
  plates: Plate[];
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
  date: string; // ISO
};

export type UnitContext = "olympic" | "crossfit" | "custom";

