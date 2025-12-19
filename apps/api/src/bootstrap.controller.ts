/* FILE: apps/api/src/bootstrap.controller.ts */
import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import type { BootstrapRequest, BootstrapResponse } from "@repo/api-contracts";
import { sha256Base64Url } from "./crypto";
import { prisma } from "./prisma";

@Controller("/v1")
export class BootstrapController {
  @Post("/bootstrap")
  async bootstrap(@Body() body: BootstrapRequest): Promise<BootstrapResponse> {
    const { deviceId, deviceToken, appVersion } = body ?? ({} as any);
    if (!deviceId || !deviceToken) {
      throw new BadRequestException("deviceId/deviceToken required");
    }

    const tokenHash = sha256Base64Url(deviceToken);
    const existing = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (existing) {
  if (existing.tokenHash !== tokenHash) {
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
    return { accountId: account.id, deviceId, serverTimeMs: now };
  }
}
