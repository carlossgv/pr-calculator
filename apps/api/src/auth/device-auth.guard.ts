/* FILE: apps/api/src/auth/device-auth.guard.ts */
  import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { prisma } from "../prisma.js";
import { sha256Base64Url } from "../crypto.js";

export type AuthedRequest = Request & { accountId?: string; deviceId?: string };

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest() as any;

    const deviceId = req.headers["x-device-id"] as string | undefined;
    const auth = req.headers["authorization"] as string | undefined;

    const token = auth?.startsWith("Bearer ")
      ? auth.slice("Bearer ".length)
      : undefined;

    if (!deviceId || !token)
      throw new UnauthorizedException("Missing device auth");

    const d = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!d) throw new UnauthorizedException("Unknown device");

    const tokenHash = sha256Base64Url(token);
    if (tokenHash !== d.tokenHash) throw new UnauthorizedException("Bad token");

    await prisma.device.update({
      where: { id: deviceId },
      data: { lastSeenAt: new Date() },
    });

    req.accountId = d.accountId;
    req.deviceId = deviceId;
    return true;
  }
}
