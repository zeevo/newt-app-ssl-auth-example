import { type DynamicModule, Module } from "@nestjs/common";
import { createDatabase } from "@newt-app-ssl-auth-example/db";
import { CertificateUserService } from "./certificate-user.service";
import { CommonNameUserDirectory } from "./common-name-user-directory";
import { DevinUserService } from "./devin-user.service";
import { InitialOwner } from "./initial-owner";
import { DATABASE, KyselyUserRepository } from "./kysely-user.repository";
import { USER_DIRECTORY } from "./user-directory";
import { USER_REPOSITORY } from "./user.repository";
import { USER_SERVICE } from "./user.service";
import { APP_CONFIG, type AppConfig } from "../app.config";

const userServices = {
  certificate: CertificateUserService,
  devin: DevinUserService,
};

@Module({})
export class UsersModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: UsersModule,
      providers: [
        { provide: APP_CONFIG, useValue: config },
        { provide: DATABASE, useFactory: () => createDatabase(config.databaseUrl) },
        { provide: USER_REPOSITORY, useClass: KyselyUserRepository },
        { provide: USER_SERVICE, useClass: userServices[config.userService] },
        { provide: USER_DIRECTORY, useClass: CommonNameUserDirectory },
        InitialOwner,
      ],
      exports: [DATABASE, USER_SERVICE, USER_DIRECTORY],
    };
  }
}
