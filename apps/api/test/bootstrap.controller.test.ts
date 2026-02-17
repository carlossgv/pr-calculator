import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  device: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  account: {
    create: vi.fn(),
  },
};

vi.mock("../src/prisma", () => ({ prisma: prismaMock }));

describe("BootstrapController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws for missing credentials", async () => {
    const { BootstrapController } = await import("../src/bootstrap.controller");
    const controller = new BootstrapController();

    await expect(
      controller.bootstrap({ deviceId: "", deviceToken: "" } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("returns existing account when token matches", async () => {
    const { BootstrapController } = await import("../src/bootstrap.controller");
    const { sha256Base64Url } = await import("../src/crypto");
    const controller = new BootstrapController();

    prismaMock.device.findUnique.mockResolvedValue({
      id: "dev-1",
      accountId: "acc-1",
      tokenHash: sha256Base64Url("token-123"),
      appVersion: "1.0.0",
    });
    prismaMock.device.update.mockResolvedValue({});

    const out = await controller.bootstrap({
      deviceId: "dev-1",
      deviceToken: "token-123",
      appVersion: "1.0.1",
    });

    expect(out.accountId).toBe("acc-1");
    expect(prismaMock.device.update).toHaveBeenCalledTimes(1);
  });

  it("creates account and device when device does not exist", async () => {
    const { BootstrapController } = await import("../src/bootstrap.controller");
    const controller = new BootstrapController();

    prismaMock.device.findUnique.mockResolvedValue(null);
    prismaMock.account.create.mockResolvedValue({ id: "acc-new" });
    prismaMock.device.create.mockResolvedValue({});

    const out = await controller.bootstrap({
      deviceId: "dev-new",
      deviceToken: "token-new",
      appVersion: "1.0.0",
    });

    expect(out.accountId).toBe("acc-new");
    expect(prismaMock.account.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.device.create).toHaveBeenCalledTimes(1);
  });
});
