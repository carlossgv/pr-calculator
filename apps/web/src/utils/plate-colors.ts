import type { Plate } from "@repo/core";

const KG_PLATE_COLORS = [
  { value: 25, color: "#e53935", text: "#fefefe" },
  { value: 20, color: "#1e88e5", text: "#fefefe" },
  { value: 15, color: "#fdd835", text: "#1a1a1a" },
  { value: 10, color: "#43a047", text: "#fefefe" },
  { value: 5, color: "#f5f5f5", text: "#1a1a1a" },
  { value: 2.5, color: "#e53935", text: "#fefefe" },
  { value: 2, color: "#1e88e5", text: "#fefefe" },
  { value: 1.5, color: "#fdd835", text: "#1a1a1a" },
  { value: 1, color: "#43a047", text: "#fefefe" },
  { value: 0.5, color: "#f5f5f5", text: "#1a1a1a" },
];

const LB_PLATE_COLORS = [
  { value: 45, color: "#1e88e5", text: "#fefefe" },
  { value: 35, color: "#fdd835", text: "#1a1a1a" },
  { value: 25, color: "#43a047", text: "#fefefe" },
  { value: 10, color: "#f5f5f5", text: "#1a1a1a" },
];

export function plateColors(plate: Plate, maxLb: number) {
  if (plate.unit === "kg") {
    let best = KG_PLATE_COLORS[0];
    for (const color of KG_PLATE_COLORS) {
      if (Math.abs(plate.value - color.value) < Math.abs(plate.value - best.value)) {
        best = color;
      }
    }
    return { color: best.color, text: best.text };
  }

  const mapped = LB_PLATE_COLORS.find((color) => color.value === plate.value);
  if (mapped) return { color: mapped.color, text: mapped.text };
  const ratio = maxLb > 0 ? Math.min(1, plate.value / maxLb) : 0;
  const lightness = Math.round(78 - ratio * 38);
  return {
    color: `hsl(0 0% ${lightness}%)`,
    text: lightness > 60 ? "#1a1a1a" : "#f7f7f7",
  };
}
