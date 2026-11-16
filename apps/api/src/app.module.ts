import { type DynamicModule, Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import type { UsersConfig } from "./users/users.config";

@Module({})
export class AppModule {
  static register(config: UsersConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [AuthModule.register(config)],
      providers: [AppService],
    };
  }
}
