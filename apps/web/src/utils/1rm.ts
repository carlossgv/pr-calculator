export function estimate1rmEpley(weight: number, reps: number) {
  if (!Number.isFinite(weight) || weight <= 0) return 0;
  if (!Number.isFinite(reps) || reps <= 1) return weight;
  return weight * (1 + reps / 30);
}
