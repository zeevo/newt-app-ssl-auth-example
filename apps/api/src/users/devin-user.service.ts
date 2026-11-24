import { Inject, Injectable } from "@nestjs/common";
import type { Organization, User } from "./user";
import { USER_REPOSITORY, type UserRepository } from "./user.repository";
import type { UserService } from "./user.service";

export const DEVIN: User = {
  id: "devin",
  dn: "CN=Devin E. Loper,OU=Development,O=Example,C=US",
  name: "Devin E. Loper",
  email: "devin@example.com",
};

// Devin owns it, so organization management can be developed locally.
export const DEVIN_ORGANIZATION: Organization = { name: "Development", slug: "development" };

/** Development only: every request signs in as Devin E. Loper, no certificate needed. */
@Injectable()
export class DevinUserService implements UserService {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  // Also repairs a Devin left without an organization, e.g. by a database
  // from before organizations, so `pnpm dev:devin` works on any database.
  async authenticate(): Promise<User> {
    return this.users.ensureOwner(DEVIN, DEVIN_ORGANIZATION);
  }
}
