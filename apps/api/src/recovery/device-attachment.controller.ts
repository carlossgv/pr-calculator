import { Body, Controller, HttpCode, HttpException, HttpStatus, Post, Req, UnauthorizedException } from "@nestjs/common";
import type { RecoveryDeviceAttachRequest, RecoveryDeviceAttachResponse } from "@repo/api-contracts";
import { DeviceAttachmentService, INVALID_RECOVERY_CREDENTIALS } from "./device-attachment.service";
import { LoginAttemptLimiter } from "./login-attempt-limiter";
import { normalizeRecoveryId } from "./recovery-id";

@Controller("/v1/recovery")
export class DeviceAttachmentController {
  constructor(
    private readonly attachment: DeviceAttachmentService,
    private readonly limiter: LoginAttemptLimiter,
  ) {}

  @Post("/connect")
  @HttpCode(200)
  async connect(@Req() req: any, @Body() body: RecoveryDeviceAttachRequest): Promise<RecoveryDeviceAttachResponse> {
    const recoveryId = normalizeRecoveryId(body.recoveryId ?? "");
    const sourceIp = req.ip ?? req.socket?.remoteAddress ?? "unknown";
    if (this.limiter.isBlocked(recoveryId, sourceIp)) {
      throw new HttpException(INVALID_RECOVERY_CREDENTIALS, HttpStatus.TOO_MANY_REQUESTS);
    }
    try {
      const result = await this.attachment.attach({ ...body, replaceLocalData: body.replaceLocalData === true });
      this.limiter.reset(recoveryId, sourceIp);
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) this.limiter.recordFailure(recoveryId, sourceIp);
      throw error;
    }
  }
}
