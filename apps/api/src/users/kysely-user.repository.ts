import { Inject, Injectable } from "@nestjs/common";
import type { Database } from "@newt-app-ssl-auth-example/db";
import type { User } from "./user";
import type { UserRepository } from "./user.repository";

export const DATABASE = Symbol("Database");

/** Reads and writes better-auth's user table. */
@Injectable()
export class KyselyUserRepository implements UserRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findByDn(dn: string): Promise<User | null> {
    const row = await this.db
      .selectFrom("user")
      .select(["id", "dn", "name", "email", "role"])
      .where("dn", "=", dn)
      .executeTakeFirst();
    return row ? { ...row, dn, role: row.role ?? "user" } : null;
  }

  async create(user: User): Promise<User> {
    const now = new Date().toISOString();
    await this.db
      .insertInto("user")
      .values({ ...user, emailVerified: 1, image: null, createdAt: now, updatedAt: now })
      .execute();
    return user;
  }
}
