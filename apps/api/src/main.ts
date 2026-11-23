import dotenv from "dotenv";
import { resolve } from "path";

// Load root .env first, then local .env (local takes precedence)
dotenv.config({ path: resolve(process.cwd(), "../../.env"), quiet: true });
dotenv.config({ path: resolve(process.cwd(), ".env"), quiet: true });

import { StandardSchemaValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadAppConfig } from "./app.config";

async function bootstrap() {
  // better-auth's middleware parses bodies itself, so Nest's parser is off.
  const app = await NestFactory.create(AppModule.register(loadAppConfig(process.env)), {
    bodyParser: false,
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
