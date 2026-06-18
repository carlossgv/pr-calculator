import { importBackup, type BackupV1 } from "./backup";

const SEEDS: Record<string, string> = {
  demo: "demo-backup.v1.json",
  graph: "trends-backup.v1.json",
  trends: "trends-backup.v1.json",
};

export async function maybeApplyDevSeedFromUrl(): Promise<boolean> {
  const appEnv = import.meta.env.VITE_APP_ENV ?? "prod";
  if (appEnv !== "dev") return false;

  const url = new URL(window.location.href);
  const seed = url.searchParams.get("seed");
  const file = seed ? SEEDS[seed] : null;
  if (!file) return false;

  const res = await fetch(`/seeds/${file}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Seed file fetch failed: ${res.status}`);

  const raw = (await res.json()) as BackupV1;
  await importBackup(raw);

  // Clean up URL to avoid accidental reseed on refresh.
  url.searchParams.delete("seed");
  const nextSearch = url.searchParams.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;
  window.history.replaceState({}, "", nextUrl);

  return true;
}
