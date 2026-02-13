import { importBackup, type BackupV1 } from "./backup";

const DEMO_SEED = "demo";

export async function maybeApplyDevSeedFromUrl(): Promise<boolean> {
  const appEnv = import.meta.env.VITE_APP_ENV ?? "prod";
  if (appEnv !== "dev") return false;

  const url = new URL(window.location.href);
  const seed = url.searchParams.get("seed");
  if (seed !== DEMO_SEED) return false;

  const res = await fetch("/seeds/demo-backup.v1.json", {
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
