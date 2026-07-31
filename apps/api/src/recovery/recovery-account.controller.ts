import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { RecoveryCredentialSetupRequest, RecoveryIdChangeRequest, RecoveryPasswordChangeRequest, RecoveryStatusResponse } from "@repo/api-contracts";
import { DeviceAuthGuard, type AuthedRequest } from "../auth/device-auth.guard";
import { RecoveryAccountService } from "./recovery-account.service";

@Controller("/v1/recovery")
@UseGuards(DeviceAuthGuard)
export class RecoveryAccountController {
  constructor(private readonly recovery: RecoveryAccountService) {}

  @Get()
  status(@Req() req: AuthedRequest): Promise<RecoveryStatusResponse> {
    return this.recovery.status(req.accountId!);
  }

  @Post()
  setup(@Req() req: AuthedRequest, @Body() body: RecoveryCredentialSetupRequest): Promise<RecoveryStatusResponse> {
    return this.recovery.setup(req.accountId!, body.recoveryId, body.password);
  }

  @Patch("/id")
  changeId(@Req() req: AuthedRequest, @Body() body: RecoveryIdChangeRequest): Promise<RecoveryStatusResponse> {
    return this.recovery.changeId(req.accountId!, body.recoveryId);
  }

  @Patch("/password")
  changePassword(@Req() req: AuthedRequest, @Body() body: RecoveryPasswordChangeRequest): Promise<RecoveryStatusResponse> {
    return this.recovery.changePassword(req.accountId!, body.password);
  }
}
