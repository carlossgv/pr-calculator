// FILE: apps/web/src/pages/HomePage.tsx
import { useEffect, useMemo, useState } from "react";
import type { Unit } from "@repo/core";
import { WeightCalculatorPanel } from "../components/WeightCalculatorPanel";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";

type Draft = { unit: Unit; weight: number; customPcts: number[] } | null;

export function HomePage() {
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<Draft>(null);

  // load once
  useEffect(() => {
    repo
      .getQuickCalculatorDraft()
      .then((d) => setDraft(d))
      .finally(() => setLoaded(true));
  }, []);

  // debounce persistence (avoid writing on every keystroke)
  useEffect(() => {
    if (!loaded) return;
    const id = window.setTimeout(() => {
      repo.setQuickCalculatorDraft(draft);
    }, 250);
    return () => window.clearTimeout(id);
  }, [loaded, draft]);

  const initialUnit = useMemo(() => draft?.unit, [draft?.unit]);
  const initialWeight = useMemo(() => draft?.weight, [draft?.weight]);
  const initialCustomPcts = useMemo(() => draft?.customPcts ?? [], [draft]);

  if (!loaded) return <p>{t.home.loading}</p>;

  return (
    <WeightCalculatorPanel
      mode="editable"
      initialUnit={initialUnit}
      initialWeight={initialWeight}
      initialCustomPcts={initialCustomPcts}
      onChange={(p) => {
        setDraft((prev) => ({
          unit: p.unit,
          weight: p.weight,
          customPcts: prev?.customPcts ?? [],
        }));
      }}
      onCustomPctsChange={(pcts) => {
        setDraft((prev) => ({
          unit: prev?.unit ?? initialUnit ?? "kg",
          weight: prev?.weight ?? initialWeight ?? 100,
          customPcts: pcts,
        }));
      }}
      fromPct={125}
      toPct={40}
      stepPct={5}
    />
  );
}
