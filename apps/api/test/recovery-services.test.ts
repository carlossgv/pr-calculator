import { BadRequestException, ConflictException, UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deriveRecoveryPassword } from "../src/recovery/recovery-password";

const mocks = vi.hoisted(() => {
  const account = {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const tx = {
    account,
    device: { findUnique: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    preferences: { deleteMany: vi.fn() },
    movement: { deleteMany: vi.fn() },
    prEntry: { deleteMany: vi.fn() },
  };
  return {
    account,
    tx,
    prisma: {
      account,
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    },
  };
});

vi.mock("../src/prisma", () => ({ prisma: mocks.prisma }));

describe("RecoveryAccountService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.$transaction.mockImplementation((callback: any) => callback(mocks.tx));
  });

  it("keeps anonymous accounts optional", async () => {
    mocks.account.findUniqueOrThrow.mockResolvedValue({ id: "source", recoveryId: null });
    const { RecoveryAccountService } = await import("../src/recovery/recovery-account.service");
    await expect(new RecoveryAccountService().status("source")).resolves.toEqual({ configured: false, recoveryId: null });
  });

  it("sets up credentials on the existing account and validates passwords", async () => {
    mocks.account.findUniqueOrThrow.mockResolvedValue({ id: "source", recoveryId: null });
    mocks.account.update.mockResolvedValue({ id: "source", recoveryId: "person-1" });
    const { RecoveryAccountService } = await import("../src/recovery/recovery-account.service");
    const service = new RecoveryAccountService();
    await expect(service.setup("source", "Person-1", "password1")).resolves.toEqual({ configured: true, recoveryId: "person-1" });
    expect(mocks.account.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "source" } }));
    await expect(service.setup("source", "Person-1", "short")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("maps uniqueness races to an unavailable response", async () => {
    mocks.account.findUniqueOrThrow.mockResolvedValue({ id: "source", recoveryId: null });
    const { Prisma } = await import("../src/generated/prisma/client");
    mocks.account.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "7.2.0" }));
    const { RecoveryAccountService } = await import("../src/recovery/recovery-account.service");
    await expect(new RecoveryAccountService().setup("source", "person-1", "password1")).rejects.toBeInstanceOf(ConflictException);
  });

  it("changes credentials without revoking devices", async () => {
    mocks.account.findUniqueOrThrow.mockResolvedValue({ id: "target", recoveryId: "person-1" });
    mocks.account.update.mockResolvedValue({ id: "target", recoveryId: "person-2" });
    const { RecoveryAccountService } = await import("../src/recovery/recovery-account.service");
    const service = new RecoveryAccountService();
    await service.changeId("target", "Person-2");
    await service.changePassword("target", "password2");
    expect(mocks.tx.device.deleteMany).not.toHaveBeenCalled();
  });
});

describe("DeviceAttachmentService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.$transaction.mockImplementation((callback: any) => callback(mocks.tx));
  });

  async function arrange(populated = false) {
    const credential = await deriveRecoveryPassword("password1");
    mocks.account.findUnique
      .mockResolvedValueOnce({
        id: "target",
        recoveryId: "person-1",
        recoveryPasswordSalt: credential.salt,
        recoveryPasswordDerived: credential.derived,
        recoveryPasswordVersion: credential.version,
      })
      .mockResolvedValueOnce({
        id: "source",
        recoveryId: null,
        _count: { devices: 1, movements: populated ? 1 : 0, prEntries: 0 },
      });
    const { sha256Base64Url } = await import("../src/crypto");
    mocks.tx.device.findUnique.mockResolvedValue({ id: "device", accountId: "source", tokenHash: sha256Base64Url("token") });
  }

  it("leaves both accounts unchanged when credentials fail", async () => {
    await arrange();
    const { DeviceAttachmentService } = await import("../src/recovery/device-attachment.service");
    await expect(new DeviceAttachmentService().attach({ deviceId: "device", deviceToken: "token", recoveryId: "person-1", password: "wrong-pass", replaceLocalData: false })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mocks.tx.device.update).not.toHaveBeenCalled();
    expect(mocks.account.delete).not.toHaveBeenCalled();
  });

  it("requires authorization for populated replacement", async () => {
    await arrange(true);
    const { DeviceAttachmentService } = await import("../src/recovery/device-attachment.service");
    await expect(new DeviceAttachmentService().attach({ deviceId: "device", deviceToken: "token", recoveryId: "person-1", password: "password1", replaceLocalData: false })).rejects.toBeInstanceOf(BadRequestException);
    expect(mocks.tx.device.update).not.toHaveBeenCalled();
  });

  it("moves the device, deletes only the abandoned account, and preserves target devices", async () => {
    await arrange();
    const { DeviceAttachmentService } = await import("../src/recovery/device-attachment.service");
    await expect(new DeviceAttachmentService().attach({ deviceId: "device", deviceToken: "token", recoveryId: "person-1", password: "password1", replaceLocalData: false })).resolves.toEqual({ accountId: "target", recoveryId: "person-1" });
    expect(mocks.tx.device.update).toHaveBeenCalledWith({ where: { id: "device" }, data: { accountId: "target" } });
    expect(mocks.account.delete).toHaveBeenCalledWith({ where: { id: "source" } });
    expect(mocks.tx.device.deleteMany).toHaveBeenCalledWith({ where: { accountId: "source" } });
  });
});
