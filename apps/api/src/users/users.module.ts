import { type DynamicModule, Module } from "@nestjs/common";
import { db } from "@newt-app-ssl-auth-example/db";
import { CertificateUserService } from "./certificate-user.service";
import { CommonNameUserDirectory } from "./common-name-user-directory";
import { DevinUserService } from "./devin-user.service";
import { DATABASE, KyselyUserRepository } from "./kysely-user.repository";
import { USER_DIRECTORY } from "./user-directory";
import { USER_REPOSITORY } from "./user.repository";
import { USER_SERVICE } from "./user.service";
import { USERS_CONFIG, type UsersConfig } from "./users.config";

const userServices = {
  certificate: CertificateUserService,
  devin: DevinUserService,
};

@Module({})
export class UsersModule {
  static register(config: UsersConfig): DynamicModule {
    return {
      module: UsersModule,
      providers: [
        { provide: USERS_CONFIG, useValue: config },
        { provide: DATABASE, useValue: db },
        { provide: USER_REPOSITORY, useClass: KyselyUserRepository },
        { provide: USER_SERVICE, useClass: userServices[config.userService] },
        { provide: USER_DIRECTORY, useClass: CommonNameUserDirectory },
      ],
      exports: [USER_SERVICE, USER_DIRECTORY],
    };
  }
}
