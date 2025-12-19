/* FILE: apps/api/src/app.module.ts */
import { Module } from "@nestjs/common";
import { BootstrapController } from "./bootstrap.controller";
import { SyncController } from "./sync.controller";

@Module({
  imports: [],
  controllers: [BootstrapController, SyncController],
  providers: [],
})
export class AppModule {}
