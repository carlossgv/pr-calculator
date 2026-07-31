import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { sha256Base64Url } from "../crypto";
import { prisma } from "../prisma";
import { normalizeRecoveryId } from "./recovery-id";
import { verifyRecoveryPassword } from "./recovery-password";

export const INVALID_RECOVERY_CREDENTIALS = "Invalid Recovery ID or password";

@Injectable()
export class DeviceAttachmentService {
  async attach(input: {
    deviceId: string;
    deviceToken: string;
    recoveryId: string;
    password: string;
    replaceLocalData: boolean;
  }) {
    const recoveryId = normalizeRecoveryId(input.recoveryId);
    return prisma.$transaction(async (tx) => {
      const target = await tx.account.findUnique({ where: { recoveryId } });
      if (
        !target?.recoveryPasswordSalt ||
        !target.recoveryPasswordDerived ||
        !target.recoveryPasswordVersion ||
        !(await verifyRecoveryPassword(input.password, {
          salt: target.recoveryPasswordSalt,
          derived: target.recoveryPasswordDerived,
          version: target.recoveryPasswordVersion,
        }))
      ) {
        throw new UnauthorizedException(INVALID_RECOVERY_CREDENTIALS);
      }

      const sourceDevice = await tx.device.findUnique({ where: { id: input.deviceId } });
      if (!sourceDevice || sourceDevice.tokenHash !== sha256Base64Url(input.deviceToken)) {
        throw new UnauthorizedException(INVALID_RECOVERY_CREDENTIALS);
      }
      if (sourceDevice.accountId === target.id) return { accountId: target.id, recoveryId };

      const source = await tx.account.findUnique({
        where: { id: sourceDevice.accountId },
        include: {
          _count: { select: { devices: true, movements: true, prEntries: true } },
        },
      });
      if (!source || source.recoveryId || source._count.devices !== 1) {
        throw new BadRequestException("Source account cannot be replaced safely");
      }
      const populated = source._count.movements > 0 || source._count.prEntries > 0;
      if (populated && !input.replaceLocalData) {
        throw new BadRequestException("Replacement authorization required");
      }

      await tx.device.update({ where: { id: input.deviceId }, data: { accountId: target.id } });
      await tx.preferences.deleteMany({ where: { accountId: source.id } });
      await tx.prEntry.deleteMany({ where: { accountId: source.id } });
      await tx.movement.deleteMany({ where: { accountId: source.id } });
      await tx.device.deleteMany({ where: { accountId: source.id } });
      await tx.account.delete({ where: { id: source.id } });
      return { accountId: target.id, recoveryId };
    });
  }

  async supportAttach(deviceId: string, recoveryIdInput: string) {
    const recoveryId = normalizeRecoveryId(recoveryIdInput);
    const target = await prisma.account.findUnique({ where: { recoveryId } });
    if (!target) throw new BadRequestException("Target recovery account not found");

    return prisma.$transaction(async (tx) => {
      const sourceDevice = await tx.device.findUnique({ where: { id: deviceId } });
      if (!sourceDevice) throw new BadRequestException("Source device not found");
      const source = await tx.account.findUnique({
        where: { id: sourceDevice.accountId },
        include: { _count: { select: { devices: true, movements: true, prEntries: true } } },
      });
      if (!source || source.recoveryId || source._count.devices !== 1 || source._count.movements || source._count.prEntries) {
        throw new BadRequestException("Source account is not an empty anonymous account");
      }
      await tx.device.update({ where: { id: deviceId }, data: { accountId: target.id } });
      await tx.preferences.deleteMany({ where: { accountId: source.id } });
      await tx.account.delete({ where: { id: source.id } });
      return { accountId: target.id, recoveryId };
    });
  }
}
