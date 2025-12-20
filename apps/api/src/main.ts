/* FILE: apps/api/src/main.ts */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ como el API ya está en su propio subdominio, NO agregamos /api
  // app.setGlobalPrefix("api");

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port, "0.0.0.0");
  Logger.debug(`API listening on http://localhost:${port}`);
}

bootstrap();
