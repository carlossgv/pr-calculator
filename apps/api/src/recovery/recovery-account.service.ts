import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../prisma";
import { isValidRecoveryId, normalizeRecoveryId } from "./recovery-id";
import { deriveRecoveryPassword, isValidRecoveryPassword } from "./recovery-password";

@Injectable()
export class RecoveryAccountService {
  async status(accountId: string) {
    const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    return { configured: account.recoveryId !== null, recoveryId: account.recoveryId };
  }

  async setup(accountId: string, recoveryId: string, password: string) {
    const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    if (account.recoveryId) throw new BadRequestException("Recovery credentials already configured");
    return this.save(accountId, recoveryId, password);
  }

  async changeId(accountId: string, recoveryId: string) {
    const normalized = this.validateId(recoveryId);
    try {
      const account = await prisma.account.update({ where: { id: accountId }, data: { recoveryId: normalized } });
      return { configured: true, recoveryId: account.recoveryId };
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async changePassword(accountId: string, password: string) {
    if (!isValidRecoveryPassword(password)) throw new BadRequestException("Password must be 8 to 128 characters");
    const existing = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    if (!existing.recoveryId) throw new BadRequestException("Recovery credentials are not configured");
    const credential = await deriveRecoveryPassword(password);
    const account = await prisma.account.update({
      where: { id: accountId },
      data: {
        recoveryPasswordSalt: credential.salt,
        recoveryPasswordDerived: credential.derived,
        recoveryPasswordVersion: credential.version,
      },
    });
    return { configured: true, recoveryId: account.recoveryId };
  }

  private async save(accountId: string, recoveryId: string, password: string) {
    const normalized = this.validateId(recoveryId);
    if (!isValidRecoveryPassword(password)) throw new BadRequestException("Password must be 8 to 128 characters");
    const credential = await deriveRecoveryPassword(password);
    try {
      const account = await prisma.account.update({
        where: { id: accountId },
        data: {
          recoveryId: normalized,
          recoveryPasswordSalt: credential.salt,
          recoveryPasswordDerived: credential.derived,
          recoveryPasswordVersion: credential.version,
        },
      });
      return { configured: true, recoveryId: account.recoveryId };
    } catch (error) {
      this.handleUnique(error);
    }
  }

  private validateId(recoveryId: string) {
    if (!isValidRecoveryId(recoveryId)) throw new BadRequestException("Recovery ID is invalid or unavailable");
    return normalizeRecoveryId(recoveryId);
  }

  private handleUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException("Recovery ID is invalid or unavailable");
    }
    throw error;
  }
}
