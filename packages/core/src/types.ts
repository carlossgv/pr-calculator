
export type Unit = "kg" | "lb";

export type UserPreferences = {
  unit: Unit;
  barWeight: number;
  plates: number[];    // por lado (ej: [25, 20, 15, 10, 5, 2.5, 1.25])
  rounding: number;    // ej: 2.5kg, 5lb
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
