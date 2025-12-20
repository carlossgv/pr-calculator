/* FILE: apps/api/src/auth/device-auth.guard.ts */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { prisma } from "../prisma";
import { sha256Base64Url } from "../crypto";

export type AuthedRequest = Request & { accountId?: string; deviceId?: string };

function mask(s: string, head = 6, tail = 4) {
  if (!s) return "";
  if (s.length <= head + tail) return `${s.slice(0, 2)}…`;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest() as any;

    const DEBUG_AUTH = process.env.DEBUG_AUTH === "1";
    const reqId = req.headers["x-request-id"] ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const deviceId = (req.headers["x-device-id"] as string | undefined) ?? undefined;
    const auth = (req.headers["authorization"] as string | undefined) ?? undefined;

    const token = auth?.startsWith("Bearer ")
      ? auth.slice("Bearer ".length)
      : undefined;

    if (DEBUG_AUTH) {
      console.log(
        `[auth][${reqId}] ${req.method} ${req.originalUrl} origin=${mask(String(req.headers["origin"] ?? ""))} ` +
          `deviceId=${deviceId ?? "∅"} authHeader=${auth ? "yes" : "no"} bearer=${token ? "yes" : "no"} token=${token ? mask(token) : "∅"}`,
      );
    }

    if (!deviceId || !token) {
      if (DEBUG_AUTH) console.log(`[auth][${reqId}] FAIL missing deviceId or token`);
      throw new UnauthorizedException("Missing device auth");
    }

    const d = await prisma.device.findUnique({ where: { id: deviceId } });

    if (!d) {
      if (DEBUG_AUTH) {
        // mini ayuda: muestra 3 últimos devices por si estás mirando otra DB
        const recent = await prisma.device.findMany({
          orderBy: { createdAt: "desc" as any },
          take: 3,
          select: { id: true, lastSeenAt: true },
        }).catch(() => []);
        console.log(`[auth][${reqId}] FAIL unknown deviceId=${deviceId}. recent=${JSON.stringify(recent)}`);
      }
      throw new UnauthorizedException("Unknown device");
    }

    const tokenHash = sha256Base64Url(token);
    if (tokenHash !== d.tokenHash) {
      if (DEBUG_AUTH) {
        console.log(
          `[auth][${reqId}] FAIL bad token deviceId=${deviceId} gotHash=${mask(tokenHash)} expectedHash=${mask(d.tokenHash)}`,
        );
      }
      throw new UnauthorizedException("Bad token");
    }

    await prisma.device.update({
      where: { id: deviceId },
      data: { lastSeenAt: new Date() },
    });

    req.accountId = d.accountId;
    req.deviceId = deviceId;

    if (DEBUG_AUTH) console.log(`[auth][${reqId}] OK accountId=${d.accountId} deviceId=${deviceId}`);
    return true;
  }
}
