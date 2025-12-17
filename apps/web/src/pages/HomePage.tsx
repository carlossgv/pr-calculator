// apps/web/src/pages/HomePage.tsx
import { WeightCalculatorPanel } from "../components/WeightCalculatorPanel";

export function HomePage() {
  return (
    <WeightCalculatorPanel
      mode="editable"
      // opcional: title="Cálculo rápido"
      fromPct={125}
      toPct={40}
      stepPct={5}
    />
  );
}
