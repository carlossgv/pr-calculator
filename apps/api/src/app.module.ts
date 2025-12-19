/* FILE: apps/api/src/app.module.ts */
import { Module } from "@nestjs/common";
import { BootstrapController } from "./bootstrap.controller.js";
import { SyncController } from "./sync.controller.js";

@Module({
  imports: [],
  controllers: [BootstrapController, SyncController],
  providers: [],
})
export class AppModule {}

