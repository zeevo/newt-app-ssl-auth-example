import { randomUUID } from "node:crypto";
import { Inject, Injectable, type OnApplicationBootstrap } from "@nestjs/common";
import { USER_REPOSITORY, type UserRepository } from "./user.repository";
import { USERS_CONFIG, type UsersConfig } from "./users.config";

/**
 * Creates the admin named by the INITIAL_ADMIN_* variables when the app starts,
 * so a fresh production database has someone who can add users. It only ever
 * creates: once a user has that DN, it is left alone, so later changes made in
 * the admin panel (including removing the role) stick.
 */
@Injectable()
export class InitialAdmin implements OnApplicationBootstrap {
  constructor(
    @Inject(USERS_CONFIG) private readonly config: UsersConfig,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const admin = this.config.initialAdmin;
    if (!admin || (await this.users.findByDn(admin.dn))) return;
    await this.users.create({ id: randomUUID(), ...admin, role: "admin" });
  }
}
