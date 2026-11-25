import { randomUUID } from "node:crypto";
import { Inject, Injectable, type OnApplicationBootstrap } from "@nestjs/common";
import { USER_REPOSITORY, type UserRepository } from "./user.repository";
import { APP_CONFIG, type AppConfig } from "../app.config";

/**
 * Creates the owner named by the INITIAL_OWNER_* variables, and their
 * INITIAL_ORGANIZATION, when the app starts, so a fresh production database
 * has someone who can add people. It only ever creates: once a user has that
 * DN, it is left alone, so later changes made in the app (including a new
 * role) stick.
 */
@Injectable()
export class InitialOwner implements OnApplicationBootstrap {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const owner = this.config.initialOwner;
    if (!owner || (await this.users.findByDn(owner.dn))) return;
    const { organization, ...user } = owner;
    await this.users.createOwner({ id: randomUUID(), ...user }, organization);
  }
}
