// apps/web/src/pages/MovementsPage.tsx
import { useEffect, useState } from "react";
import type { Movement } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { Link } from "react-router-dom";

function uid() {
  return crypto.randomUUID();
}

export function MovementsPage() {
  const [items, setItems] = useState<Movement[]>([]);
  const [name, setName] = useState("");

  async function reload() {
    setItems(await repo.listMovements());
  }

  useEffect(() => {
    reload();
  }, []);

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await repo.upsertMovement({ id: uid(), name: trimmed, createdAt: new Date().toISOString() });
    setName("");
    await reload();
  }

  async function remove(id: string) {
    await repo.deleteMovement(id);
    await reload();
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder={t.movements.placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={add}>{t.movements.add}</button>
      </div>

      <ul style={{ paddingLeft: 18 }}>
        {items.map((m) => (
          <li key={m.id} style={{ marginBottom: 10 }}>
            <Link to={`/movements/${m.id}`}>{m.name}</Link>
            <button onClick={() => remove(m.id)} style={{ marginLeft: 10 }}>
              {t.movements.delete}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
