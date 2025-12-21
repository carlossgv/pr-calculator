// FILE: apps/web/src/pages/MovementsPage.tsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Movement, PrEntry, UserPreferences } from "@repo/core";
import { repo } from "../storage/repo";
import { t } from "../i18n/strings";
import { useLocation, useNavigate } from "react-router-dom";
import { Chip, Sticker, Surface, SurfaceHeader } from "../ui/Surface";
import { Modal } from "../ui/Modal";
import styles from "./MovementsPage.module.css";
import { ArrowUpDown, Check, Plus, X, Settings2 } from "lucide-react";
import { Button } from "../ui/Button";

function uid() {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }

  try {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch {
    return `m_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

type Stats = {
  best: PrEntry | null;
  latest: PrEntry | null;
};

function pickStats(entries: PrEntry[]): Stats {
  if (entries.length === 0) return { best: null, latest: null };

  let best = entries[0];
  let latest = entries[0];

  for (const e of entries) {
    if (e.weight > best.weight) best = e;
    if (e.date > latest.date) latest = e;
  }

  return { best, latest };
}

function toDateLabel(iso: string) {
  return iso.slice(0, 10);
}

type SortKey =
  | "activity_desc"
  | "created_desc"
  | "created_asc"
  | "name_asc"
  | "name_desc"
  | "best_desc";

type PopoverPlacement = "below" | "above";
type PopoverPos = { top: number; left: number; placement: PopoverPlacement };

function isDesktop() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 1024px)").matches;
}

export function MovementsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [items, setItems] = useState<Movement[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, Stats>>({});

  // UI
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("activity_desc");
  const [sortOpen, setSortOpen] = useState(false);

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addErr, setAddErr] = useState<string | null>(null);
  const [addBusy, setAddBusy] = useState(false);
  const addInputRef = useRef<HTMLInputElement | null>(null);

  const sortBtnRef = useRef<HTMLButtonElement | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPos | null>(null);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "activity_desc", label: t.movements.sort.recentActivity },
    { key: "created_desc", label: t.movements.sort.createdNewest },
    { key: "created_asc", label: t.movements.sort.createdOldest },
    { key: "name_asc", label: t.movements.sort.nameAZ },
    { key: "name_desc", label: t.movements.sort.nameZA },
    { key: "best_desc", label: t.movements.sort.bestPrWeight },
  ];

  async function reload() {
    const [p, movements] = await Promise.all([
      repo.getPreferences(),
      repo.listMovements(),
    ]);

    setPrefs(p);
    setItems(movements);

    const pairs = await Promise.all(
      movements.map(async (m) => {
        const entries = await repo.listPrEntries(m.id);
        return [m.id, pickStats(entries)] as const;
      }),
    );

    const next: Record<string, Stats> = {};
    for (const [id, s] of pairs) next[id] = s;
    setStatsMap(next);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    reload();
  }, []);

  async function createMovementAndGoManage() {
    const trimmed = newName.trim();
    if (!trimmed) {
      setAddErr(t.movements.create.errorEmpty);
      return;
    }

    const id = uid();

    try {
      setAddErr(null);
      setAddBusy(true);

      const now = new Date().toISOString();

      await repo.upsertMovement({
        id,
        name: trimmed,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      setNewName("");
      setAddOpen(false);

      navigate(`/movements/${id}/manage`);
    } finally {
      setAddBusy(false);
    }
  }

  function goCalc(movementId: string) {
    const unit = prefs?.defaultUnit ?? "kg";
    const best = statsMap[movementId]?.best;
    const weight = best?.weight ?? 100;
    navigate(`/movements/${movementId}/calc/${unit}/${weight}`);
  }

  function goManage(movementId: string) {
    navigate(`/movements/${movementId}/manage`);
  }

  const unit = prefs?.defaultUnit ?? "kg";
  const sortIsDefault = sortKey === "activity_desc";

  const cards = useMemo(() => {
    const raw = items.map((m) => {
      const s = statsMap[m.id] ?? { best: null, latest: null };
      return { m, best: s.best, latest: s.latest };
    });

    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? raw.filter(({ m }) => m.name.toLowerCase().includes(needle))
      : raw;

    const activityDate = (x: { m: Movement; latest: PrEntry | null }) =>
      x.latest?.date ?? x.m.createdAt;

    const cmp = (
      a: (typeof filtered)[number],
      b: (typeof filtered)[number],
    ) => {
      switch (sortKey) {
        case "activity_desc": {
          const da = activityDate(a);
          const db = activityDate(b);
          if (da === db) return a.m.name.localeCompare(b.m.name);
          return db.localeCompare(da);
        }
        case "created_desc": {
          if (a.m.createdAt === b.m.createdAt)
            return a.m.name.localeCompare(b.m.name);
          return b.m.createdAt.localeCompare(a.m.createdAt);
        }
        case "created_asc": {
          if (a.m.createdAt === b.m.createdAt)
            return a.m.name.localeCompare(b.m.name);
          return a.m.createdAt.localeCompare(b.m.createdAt);
        }
        case "name_asc":
          return a.m.name.localeCompare(b.m.name);
        case "name_desc":
          return b.m.name.localeCompare(a.m.name);
        case "best_desc": {
          const wa = a.best?.weight ?? -Infinity;
          const wb = b.best?.weight ?? -Infinity;
          if (wa === wb) return a.m.name.localeCompare(b.m.name);
          return wb - wa;
        }
        default:
          return 0;
      }
    };

    return [...filtered].sort(cmp);
  }, [items, statsMap, q, sortKey]);

  const total = items.length;
  const shown = cards.length;

  function computePopover() {
    if (!isDesktop()) {
      setPopoverPos(null);
      return;
    }

    const btn = sortBtnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const gutter = 12;
    const gap = 10;

    const width = 360;
    const maxH = 520;

    const left = Math.min(
      Math.max(gutter, rect.right - width),
      window.innerWidth - gutter - width,
    );

    const belowTop = rect.bottom + gap;
    const wouldOverflowBottom = belowTop + maxH > window.innerHeight - gutter;

    if (wouldOverflowBottom) {
      const top = Math.max(gutter, rect.top - gap - maxH);
      setPopoverPos({ top, left, placement: "above" });
      return;
    }

    setPopoverPos({ top: belowTop, left, placement: "below" });
  }

  function openSort() {
    setAddOpen(false);
    setSortOpen(true);
  }

  function openAdd() {
    setSortOpen(false);
    setPopoverPos(null);
    setAddErr(null);
    setAddOpen(true);
  }

  useLayoutEffect(() => {
    if (!sortOpen) return;
    computePopover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOpen]);

  useEffect(() => {
    if (!addOpen) return;
    const tmr = window.setTimeout(() => addInputRef.current?.focus(), 0);
    return () => window.clearTimeout(tmr);
  }, [addOpen]);

  useEffect(() => {
    if (!sortOpen && !addOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSortOpen(false);
        setAddOpen(false);
      }
    };

    const onRecalc = () => computePopover();

    window.addEventListener("keydown", onKey);

    if (sortOpen) {
      window.addEventListener("resize", onRecalc);
      window.addEventListener("scroll", onRecalc, true);
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onRecalc);
      window.removeEventListener("scroll", onRecalc, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOpen, addOpen]);

  return (
    <div className={styles.page}>
      <Surface variant="panel" aria-label="Movements panel">
        <SurfaceHeader
          leftLabel={<Sticker stamp={<span>LIST</span>}>PR CALC</Sticker>}
          rightChip={<Chip tone="accent3">{unit}</Chip>}
          showBarcode
        />

        <div className={styles.controlsRow}>
          <div className={styles.searchWrap}>
            <input
              className={styles.searchInput}
              placeholder={t.movements.filterPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            {q.trim() ? (
              <div className={styles.clearBtnPos}>
                <Button
                  variant="outline"
                  size="sm"
                  shape="round"
                  iconOnly
                  className={styles.iconBtnSm}
                  aria-label={t.movements.clearFilterAria}
                  title={t.movements.clearFilterAria}
                  onClick={() => setQ("")}
                  leftIcon={<X size={16} />}
                />
              </div>
            ) : null}
          </div>

          <div ref={sortBtnRef as any}>
            <Button
              variant="outline"
              size="md"
              shape="round"
              iconOnly
              className={`${styles.sortPill} ${styles.iconBtnMd} ${
                !sortIsDefault ? styles.sortActive : ""
              }`}
              onClick={openSort}
              aria-label={t.movements.sort.aria}
              title={t.movements.sort.aria}
              leftIcon={<ArrowUpDown size={18} />}
            />
          </div>

          <Button
            variant="solid"
            size="md"
            shape="round"
            iconOnly
            className={styles.iconBtnMd}
            onClick={openAdd}
            aria-label={t.movements.create.aria}
            title={t.movements.create.aria}
            leftIcon={<Plus size={18} />}
          />
        </div>

        <div className={styles.hint}>
          {total === 0 ? (
            <span className={styles.muted}>{t.movements.emptyHint}</span>
          ) : shown === 0 ? (
            <span className={styles.muted}>
              {t.movements.noMatches} “{q.trim()}”.
            </span>
          ) : (
            <span className={styles.muted}>
              {t.movements.showing} <b>{shown}</b> / <b>{total}</b>
            </span>
          )}
        </div>
      </Surface>

      <div className={styles.list}>
        {cards.map(({ m, best }) => (
          <Surface key={m.id} variant="card" className={styles.item}>
            <div className={styles.itemTop}>
              <div className={styles.meta}>
                <div className={styles.name} title={m.name}>
                  {m.name}
                </div>

                {best ? (
                  <div className={styles.sub}>
                    {toDateLabel(best.date)} · <b>{best.weight}</b> ×{" "}
                    {best.reps} <span className={styles.unitHint}>{unit}</span>
                  </div>
                ) : (
                  <div className={styles.subMuted}>{t.movements.noPrYet}</div>
                )}
              </div>
            </div>

            <div className={styles.actionsRow}>
              <Button
                variant="solid"
                size="md"
                shape="default"
                className={styles.calcWide}
                onClick={() => goCalc(m.id)}
                aria-label={t.movements.openCalculator}
                title={t.movements.openCalculator}
              >
                PR Calculator
              </Button>

              <Button
                variant="outline"
                size="md"
                shape="round"
                iconOnly
                className={styles.iconBtnMd}
                aria-label={t.movements.managePrs}
                title={t.movements.managePrs}
                onClick={() => goManage(m.id)}
                leftIcon={<Settings2 size={18} />}
              />
            </div>
          </Surface>
        ))}
      </div>

      {/* SORT sheet/popover */}
      {sortOpen ? (
        <div
          className={`${styles.sheetOverlay} ${
            popoverPos ? styles.sheetOverlayDesktop : ""
          }`}
          role="dialog"
          aria-modal="true"
          onClick={() => setSortOpen(false)}
        >
          <div
            className={`${styles.sheet} ${popoverPos ? styles.sheetDesktop : ""} ${
              popoverPos?.placement === "above" ? styles.sheetAbove : ""
            }`}
            style={
              popoverPos
                ? ({
                    top: popoverPos.top,
                    left: popoverPos.left,
                  } as React.CSSProperties)
                : undefined
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sheetHeader}>
              <div className={styles.sheetTitle}>{t.movements.sort.title}</div>

              <Button
                variant="outline"
                size="sm"
                shape="round"
                iconOnly
                className={styles.iconBtnSm}
                onClick={() => setSortOpen(false)}
                aria-label={t.movements.closeAria}
                title={t.movements.closeAria}
                leftIcon={<X size={18} />}
              />
            </div>

            <div className={styles.sheetBody}>
              {sortOptions.map((opt) => {
                const active = opt.key === sortKey;
                return (
                  <Button
                    key={opt.key}
                    variant="ghost"
                    size="md"
                    shape="default"
                    className={styles.sheetOption}
                    onClick={() => {
                      setSortKey(opt.key);
                      setSortOpen(false);
                    }}
                    rightIcon={active ? <Check size={18} /> : null}
                  >
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* ADD movement modal */}
      {addOpen ? (
        <Modal
          title={t.movements.create.title}
          ariaLabel={t.movements.create.title}
          onClose={() => setAddOpen(false)}
        >
          <label className={styles.modalLabel}>
            <span className={styles.modalLabelText}>
              {t.movements.create.nameLabel}
            </span>
            <input
              ref={addInputRef}
              className={styles.modalInput}
              placeholder={t.movements.placeholder}
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (addErr) setAddErr(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") createMovementAndGoManage();
              }}
            />
          </label>

          {addErr ? <div className={styles.modalError}>{addErr}</div> : null}

          <div className={styles.modalActions}>
            <Button
              variant="solid"
              size="md"
              shape="pill"
              fullWidth
              disabled={addBusy}
              onClick={createMovementAndGoManage}
            >
              {t.movements.create.createCta}
            </Button>

            <Button
              variant="ghost"
              size="md"
              shape="pill"
              fullWidth
              disabled={addBusy}
              onClick={() => setAddOpen(false)}
            >
              {t.movements.create.cancelCta}
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
