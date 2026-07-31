/* FILE: apps/api/src/app.module.ts */
import { Module } from "@nestjs/common";
import { BootstrapController } from "./bootstrap.controller";
import { SyncController } from "./sync.controller";
import { DeviceAuthGuard } from "./auth/device-auth.guard";
import { RecoveryAccountController } from "./recovery/recovery-account.controller";
import { RecoveryAccountService } from "./recovery/recovery-account.service";
import { DeviceAttachmentController } from "./recovery/device-attachment.controller";
import { DeviceAttachmentService } from "./recovery/device-attachment.service";
import { LoginAttemptLimiter } from "./recovery/login-attempt-limiter";

@Module({
  imports: [],
  controllers: [BootstrapController, SyncController, RecoveryAccountController, DeviceAttachmentController],
  providers: [DeviceAuthGuard, RecoveryAccountService, DeviceAttachmentService, LoginAttemptLimiter],
})
export class AppModule {}
