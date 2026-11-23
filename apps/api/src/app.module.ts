import { join } from "path";
import { type DynamicModule, Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { AuthModule as BetterAuthModule } from "@thallesp/nestjs-better-auth";
import type { Auth } from "@newt-app-ssl-auth-example/auth";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AUTH, AuthModule } from "./auth/auth.module";
import type { AppConfig } from "./app.config";

@Module({})
export class AppModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        // serves apps/web's static export; resolved from dist/, so it works from any cwd
        ServeStaticModule.forRoot({
          rootPath: join(__dirname, "../../web/out"),
          exclude: ["/api/{*splat}", "/{*path}.:ext"],
        }),
        // mounts the DI-built better-auth instance on /api/auth and guards
        // every other route unless it is marked @AllowAnonymous()
        BetterAuthModule.forRootAsync({
          imports: [AuthModule.register(config)],
          inject: [AUTH],
          useFactory: (auth: Auth) => ({ auth }),
        }),
      ],
      controllers: [AppController],
      providers: [AppService],
    };
  }
}
