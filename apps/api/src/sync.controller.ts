/* FILE: apps/api/src/sync.controller.ts */
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import type {
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
} from "@repo/api-contracts";
import { prisma } from "./prisma";
import { DeviceAuthGuard } from "./auth/device-auth.guard";

function msToDate(ms: number) {
  return new Date(ms);
}

function dateToMs(d: Date) {
  return d.getTime();
}

@Controller("/v1/sync")
@UseGuards(DeviceAuthGuard)
export class SyncController {
  @Post("/push")
  async push(
    @Req() req: any,
    @Body() body: SyncPushRequest,
  ): Promise<SyncPushResponse> {
    const accountId = req.accountId as string;
    const now = Date.now();

    let accepted = 0;

    // preferences (single row)
    if (body.preferences) {
      const env: any = body.preferences;
      const updatedAt = msToDate(env.updatedAtMs ?? now);
      const deletedAt = env.deletedAtMs ? msToDate(env.deletedAtMs) : null;

      const existing = await prisma.preferences.findUnique({
        where: { accountId },
      });
      const shouldWrite =
        !existing || updatedAt.getTime() > existing.updatedAt.getTime();

      if (shouldWrite) {
        await prisma.preferences.upsert({
          where: { accountId },
          create: {
            accountId,
            value: env.value ?? {},
            updatedAt,
            deletedAt,
          },
          update: {
            value: env.value ?? {},
            updatedAt,
            deletedAt,
          },
        });
        accepted++;
      }
    }

    // movements
    if (Array.isArray(body.movements)) {
      for (const env of body.movements as any[]) {
        const updatedAt = msToDate(env.updatedAtMs ?? now);
        const deletedAt = env.deletedAtMs ? msToDate(env.deletedAtMs) : null;

        const existing = await prisma.movement.findUnique({
          where: { id: env.id },
        });
        const shouldWrite =
          !existing || updatedAt.getTime() > existing.updatedAt.getTime();

        if (shouldWrite) {
          await prisma.movement.upsert({
            where: { id: env.id },
            create: {
              id: env.id,
              accountId,
              value: env.value ?? {},
              updatedAt,
              deletedAt,
            },
            update: {
              accountId, // enforce tenant
              value: env.value ?? existing?.value ?? {},
              updatedAt,
              deletedAt,
            },
          });
          accepted++;
        }
      }
    }

    // prEntries
    if (Array.isArray(body.prEntries)) {
      for (const env of body.prEntries as any[]) {
        const updatedAt = msToDate(env.updatedAtMs ?? now);
        const deletedAt = env.deletedAtMs ? msToDate(env.deletedAtMs) : null;

        const existing = await prisma.prEntry.findUnique({
          where: { id: env.id },
        });
        const shouldWrite =
          !existing || updatedAt.getTime() > existing.updatedAt.getTime();

        const movementId =
          (env.value as any)?.movementId ?? existing?.movementId ?? null;

        if (shouldWrite) {
          await prisma.prEntry.upsert({
            where: { id: env.id },
            create: {
              id: env.id,
              accountId,
              movementId,
              value: env.value ?? {},
              updatedAt,
              deletedAt,
            },
            update: {
              accountId,
              movementId,
              value: env.value ?? existing?.value ?? {},
              updatedAt,
              deletedAt,
            },
          });
          accepted++;
        }
      }
    }

    return { accepted, serverTimeMs: now };
  }

  @Get("/pull")
  async pull(
    @Req() req: any,
    @Query("sinceMs") sinceMsRaw?: string,
  ): Promise<SyncPullResponse> {
    const accountId = req.accountId as string;
    const sinceMs = sinceMsRaw ? Number(sinceMsRaw) : 0;
    const since = msToDate(Number.isFinite(sinceMs) ? sinceMs : 0);

    const now = Date.now();

    const prefs = await prisma.preferences.findUnique({ where: { accountId } });

    const movements = await prisma.movement.findMany({
      where: { accountId, updatedAt: { gt: since } },
      orderBy: { updatedAt: "asc" },
    });

    const prEntries = await prisma.prEntry.findMany({
      where: { accountId, updatedAt: { gt: since } },
      orderBy: { updatedAt: "asc" },
    });

    return {
      serverTimeMs: now,
      preferences: prefs
        ? {
            id: "prefs",
            updatedAtMs: dateToMs(prefs.updatedAt),
            deletedAtMs: prefs.deletedAt ? dateToMs(prefs.deletedAt) : null,
            value: prefs.value as any,
          }
        : null,

      movements: movements.map((m: any) => ({
        id: m.id,
        updatedAtMs: dateToMs(m.updatedAt),
        deletedAtMs: m.deletedAt ? dateToMs(m.deletedAt) : null,
        // ✅ siempre mandamos value (aunque esté deleted), el cliente decide por deletedAtMs
        value: m.value as any,
      })),

      prEntries: prEntries.map((e: any) => ({
        id: e.id,
        updatedAtMs: dateToMs(e.updatedAt),
        deletedAtMs: e.deletedAt ? dateToMs(e.deletedAt) : null,
        // ✅ siempre mandamos value (aunque esté deleted), ayuda con movementId/index
        value: e.value as any,
      })),
    };
  }
}
