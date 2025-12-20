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

function mask(s: string, head = 6, tail = 4) {
  if (!s) return "";
  if (s.length <= head + tail) return `${s.slice(0, 2)}…`;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function safeJson(x: unknown, maxLen = 900) {
  try {
    const s = JSON.stringify(x);
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  } catch {
    return "[unserializable]";
  }
}

@Controller("/v1/sync")
@UseGuards(DeviceAuthGuard)
export class SyncController {
  @Post("/push")
  async push(
    @Req() req: any,
    @Body() body: SyncPushRequest,
  ): Promise<SyncPushResponse> {
    const DEBUG_SYNC = process.env.DEBUG_SYNC === "1";
    const DEBUG_SYNC_BODY = process.env.DEBUG_SYNC_BODY === "1";

    const accountId = req.accountId as string;
    const deviceId = (req.deviceId as string) ?? (req.headers?.["x-device-id"] as string) ?? "∅";
    const now = Date.now();

    if (DEBUG_SYNC) {
      const prefs = body?.preferences ? 1 : 0;
      const mov = Array.isArray(body?.movements) ? body.movements.length : 0;
      const prs = Array.isArray(body?.prEntries) ? body.prEntries.length : 0;
      const since = (body as any)?.sinceMs;
      const clientTime = (body as any)?.clientTimeMs;
      console.log(
        `[sync][push] deviceId=${deviceId} accountId=${accountId} prefs=${prefs} movements=${mov} prEntries=${prs} sinceMs=${since ?? "∅"} clientTimeMs=${clientTime ?? "∅"}`,
      );
      if (DEBUG_SYNC_BODY) {
        console.log(`[sync][push] body=${safeJson(body)}`);
      }
    }

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

      if (DEBUG_SYNC) {
        console.log(
          `[sync][push][prefs] shouldWrite=${shouldWrite} updatedAt=${updatedAt.toISOString()} existingUpdatedAt=${existing?.updatedAt?.toISOString?.() ?? "∅"} deletedAt=${deletedAt?.toISOString?.() ?? "∅"}`,
        );
      }

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

        if (DEBUG_SYNC && (shouldWrite || process.env.DEBUG_SYNC_VERBOSE === "1")) {
          console.log(
            `[sync][push][movement] id=${env.id} shouldWrite=${shouldWrite} updatedAt=${updatedAt.toISOString()} existingUpdatedAt=${existing?.updatedAt?.toISOString?.() ?? "∅"} deletedAt=${deletedAt?.toISOString?.() ?? "∅"}`,
          );
        }

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

        if (DEBUG_SYNC && (shouldWrite || process.env.DEBUG_SYNC_VERBOSE === "1")) {
          console.log(
            `[sync][push][prEntry] id=${env.id} shouldWrite=${shouldWrite} movementId=${movementId ?? "∅"} updatedAt=${updatedAt.toISOString()} existingUpdatedAt=${existing?.updatedAt?.toISOString?.() ?? "∅"} deletedAt=${deletedAt?.toISOString?.() ?? "∅"}`,
          );
        }

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

    if (DEBUG_SYNC) {
      console.log(
        `[sync][push] done deviceId=${deviceId} accountId=${accountId} accepted=${accepted} serverTimeMs=${now}`,
      );
    }

    return { accepted, serverTimeMs: now };
  }

  @Get("/pull")
  async pull(
    @Req() req: any,
    @Query("sinceMs") sinceMsRaw?: string,
  ): Promise<SyncPullResponse> {
    const DEBUG_SYNC = process.env.DEBUG_SYNC === "1";

    const accountId = req.accountId as string;
    const deviceId = (req.deviceId as string) ?? (req.headers?.["x-device-id"] as string) ?? "∅";

    const sinceMs = sinceMsRaw ? Number(sinceMsRaw) : 0;
    const since = msToDate(Number.isFinite(sinceMs) ? sinceMs : 0);

    const now = Date.now();

    if (DEBUG_SYNC) {
      console.log(
        `[sync][pull] deviceId=${deviceId} accountId=${accountId} sinceMsRaw=${sinceMsRaw ?? "∅"} since=${since.toISOString()} now=${now}`,
      );
    }

    const prefs = await prisma.preferences.findUnique({ where: { accountId } });

    const movements = await prisma.movement.findMany({
      where: { accountId, updatedAt: { gt: since } },
      orderBy: { updatedAt: "asc" },
    });

    const prEntries = await prisma.prEntry.findMany({
      where: { accountId, updatedAt: { gt: since } },
      orderBy: { updatedAt: "asc" },
    });

    if (DEBUG_SYNC) {
      console.log(
        `[sync][pull] result deviceId=${deviceId} accountId=${accountId} prefs=${prefs ? "yes" : "no"} movements=${movements.length} prEntries=${prEntries.length}`,
      );
      const auth = (req.headers?.["authorization"] as string | undefined) ?? "";
      const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
      if (token) console.log(`[sync][pull] token=${mask(token)} deviceId=${deviceId}`);
    }

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
