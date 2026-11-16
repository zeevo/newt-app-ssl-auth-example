import { type DynamicModule, Module } from "@nestjs/common";
import { createAuth } from "@newt-app-ssl-auth-example/auth";
import { USER_DIRECTORY, type UserDirectory } from "../users/user-directory";
import { USER_SERVICE, type UserService } from "../users/user.service";
import type { UsersConfig } from "../users/users.config";
import { UsersModule } from "../users/users.module";

export const AUTH = Symbol("Auth");

/**
 * Provides the better-auth instance. SSL sign-in goes through whichever
 * UserService is bound, and new users are looked up in the bound UserDirectory.
 */
@Module({})
export class AuthModule {
  static register(config: UsersConfig): DynamicModule {
    return {
      module: AuthModule,
      imports: [UsersModule.register(config)],
      providers: [
        {
          provide: AUTH,
          inject: [USER_SERVICE, USER_DIRECTORY],
          useFactory: (users: UserService, directory: UserDirectory) =>
            createAuth({
              authenticate: async (headers) => (await users.authenticate(headers))?.id ?? null,
              lookup: (dn) => directory.lookup(dn),
            }),
        },
      ],
      exports: [AUTH],
    };
  }
}
