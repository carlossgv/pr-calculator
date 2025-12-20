/* FILE: apps/api/src/bootstrap.controller.ts */
import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import type { BootstrapRequest, BootstrapResponse } from "@repo/api-contracts";
import { sha256Base64Url } from "./crypto";
import { prisma } from "./prisma";

function mask(s: string, head = 6, tail = 4) {
  if (!s) return "";
  if (s.length <= head + tail) return `${s.slice(0, 2)}…`;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

@Controller("/v1")
export class BootstrapController {
  @Post("/bootstrap")
  async bootstrap(@Body() body: BootstrapRequest): Promise<BootstrapResponse> {
    const DEBUG_SYNC = process.env.DEBUG_SYNC === "1";

    const { deviceId, deviceToken, appVersion } = body ?? ({} as any);
    if (DEBUG_SYNC) {
      console.log(
        `[bootstrap] deviceId=${deviceId ?? "∅"} token=${deviceToken ? mask(deviceToken) : "∅"} appVersion=${appVersion ?? "∅"}`,
      );
    }

    if (!deviceId || !deviceToken) {
      throw new BadRequestException("deviceId/deviceToken required");
    }

    const tokenHash = sha256Base64Url(deviceToken);
    const existing = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (existing) {
      if (existing.tokenHash !== tokenHash) {
        if (DEBUG_SYNC) {
          console.log(
            `[bootstrap] token mismatch deviceId=${deviceId} got=${mask(tokenHash)} expected=${mask(existing.tokenHash)}`,
          );
        }
        throw new BadRequestException("Device token mismatch");
      }

      const now = new Date();
      await prisma.device.update({
        where: { id: deviceId },
        data: {
          lastSeenAt: now,
          appVersion: appVersion ?? existing.appVersion ?? null,
        },
      });

      if (DEBUG_SYNC) console.log(`[bootstrap] OK existing deviceId=${deviceId} accountId=${existing.accountId}`);
      return { accountId: existing.accountId, deviceId, serverTimeMs: now.getTime() };
    }

    const account = await prisma.account.create({ data: {} });
    await prisma.device.create({
      data: {
        id: deviceId,
        accountId: account.id,
        tokenHash,
        appVersion: appVersion ?? null,
      },
    });

    const now = Date.now();
    if (DEBUG_SYNC) console.log(`[bootstrap] OK created deviceId=${deviceId} accountId=${account.id}`);
    return { accountId: account.id, deviceId, serverTimeMs: now };
  }
}
