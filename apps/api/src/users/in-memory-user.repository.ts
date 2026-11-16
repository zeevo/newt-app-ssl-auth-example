import type { User } from "./user";
import type { UserRepository } from "./user.repository";

/** A UserRepository for tests. */
export class InMemoryUserRepository implements UserRepository {
  readonly users: User[] = [];

  async findByDn(dn: string): Promise<User | null> {
    return this.users.find((user) => user.dn === dn) ?? null;
  }

  async create(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }
}
