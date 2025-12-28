// FILE: apps/web/src/utils/warmup.ts
export type WarmupTemplateId = "crossfit" | "strength" | "olympic";

export type WarmupStep = {
  pct: number; // 0-100
  reps: string;
};

export type WarmupTemplate = {
  id: WarmupTemplateId;
  steps: WarmupStep[];
};

export const WARMUP_TEMPLATES: WarmupTemplate[] = [
  {
    id: "crossfit",
    steps: [
      { pct: 40, reps: "5" },
      { pct: 55, reps: "3" },
      { pct: 70, reps: "2" },
      { pct: 80, reps: "1" },
      { pct: 90, reps: "1" },
    ],
  },
  {
    id: "strength",
    steps: [
      { pct: 35, reps: "5" },
      { pct: 50, reps: "3" },
      { pct: 60, reps: "3" },
      { pct: 70, reps: "2" },
      { pct: 80, reps: "1" },
      { pct: 85, reps: "1" },
      { pct: 90, reps: "1" },
    ],
  },
  {
    id: "olympic",
    steps: [
      { pct: 40, reps: "3" },
      { pct: 55, reps: "2" },
      { pct: 65, reps: "2" },
      { pct: 75, reps: "1" },
      { pct: 80, reps: "1" },
      { pct: 85, reps: "1" },
    ],
  },
];
