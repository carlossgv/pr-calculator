// FILE: apps/api/scripts/export-by-deviceId.ts
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { prisma } from "../src/prisma";

type Options = {
  deviceId: string;
  out?: string;
  includeDeleted: boolean;
  pretty: boolean;
};

function parseArgs(argv: string[]): Options {
  const deviceId = argv[0];
  if (!deviceId) {
    console.error(
      "Usage: pnpm -C apps/api ts-node scripts/export-by-deviceId.ts <deviceId> [--out ./export.json] [--include-deleted] [--min]",
    );
    process.exit(1);
  }

  const outIdx = argv.indexOf("--out");
  const out = outIdx >= 0 ? argv[outIdx + 1] : undefined;

  const includeDeleted = argv.includes("--include-deleted");
  const pretty = !argv.includes("--min");

  return { deviceId, out, includeDeleted, pretty };
}

function toMs(d: Date | null | undefined) {
  return d ? d.getTime() : null;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const device = await prisma.device.findUnique({
    where: { id: opts.deviceId },
  });

  if (!device) {
    // mini-ayuda (igual que tu guard)
    const recent = await prisma.device
      .findMany({
        orderBy: { createdAt: "desc" as any },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          lastSeenAt: true,
          appVersion: true,
        },
      })
      .catch(() => []);
    console.error(
      `Unknown deviceId=${opts.deviceId}. Recent devices:\n${JSON.stringify(
        recent,
        null,
        2,
      )}`,
    );
    process.exit(2);
  }

  const accountId = device.accountId;

  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  const preferences = await prisma.preferences.findUnique({
    where: { accountId },
  });

  const movementWhere: any = { accountId };
  const prWhere: any = { accountId };

  if (!opts.includeDeleted) {
    movementWhere.deletedAt = null;
    prWhere.deletedAt = null;
    // prefs también puede estar soft-deleted
  }

  const movements = await prisma.movement.findMany({
    where: movementWhere,
    orderBy: { updatedAt: "asc" },
  });

  const prEntries = await prisma.prEntry.findMany({
    where: prWhere,
    orderBy: { updatedAt: "asc" },
  });

  // Un “summary” útil para validar rápido crecimiento
  const summary = {
    deviceId: device.id,
    accountId,
    appVersion: device.appVersion ?? null,
    deviceCreatedAtMs: toMs(device.createdAt),
    lastSeenAtMs: toMs(device.lastSeenAt),
    hasPreferences:
      !!preferences && (opts.includeDeleted || !preferences.deletedAt),
    movements: movements.length,
    prEntries: prEntries.length,
    latestMovementUpdatedAtMs: movements.length
      ? toMs(movements[movements.length - 1]!.updatedAt)
      : null,
    latestPrUpdatedAtMs: prEntries.length
      ? toMs(prEntries[prEntries.length - 1]!.updatedAt)
      : null,
  };

  const bundle = {
    summary,
    device: {
      id: device.id,
      accountId: device.accountId,
      appVersion: device.appVersion ?? null,
      createdAtMs: toMs(device.createdAt),
      lastSeenAtMs: toMs(device.lastSeenAt),
      // tokenHash es sensible; no lo exporto por defecto
    },
    account: account
      ? { id: account.id, createdAtMs: toMs(account.createdAt) }
      : null,
    preferences: preferences
      ? {
          accountId: preferences.accountId,
          value: preferences.value,
          updatedAtMs: toMs(preferences.updatedAt),
          deletedAtMs: toMs(preferences.deletedAt),
        }
      : null,
    movements: movements.map((m) => ({
      id: m.id,
      accountId: m.accountId,
      value: m.value,
      updatedAtMs: toMs(m.updatedAt),
      deletedAtMs: toMs(m.deletedAt),
    })),
    prEntries: prEntries.map((p) => ({
      id: p.id,
      accountId: p.accountId,
      movementId: p.movementId ?? null,
      value: p.value,
      updatedAtMs: toMs(p.updatedAt),
      deletedAtMs: toMs(p.deletedAt),
    })),
  };

  const json = opts.pretty
    ? JSON.stringify(bundle, null, 2)
    : JSON.stringify(bundle);

  if (opts.out) {
    writeFileSync(opts.out, json, "utf8");
    console.log(`Wrote ${opts.out}`);
  } else {
    console.log(json);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    // Prisma adapter-pg igual mantiene pool; esto ayuda a cerrar limpio
    await prisma.$disconnect().catch(() => {});
  });
