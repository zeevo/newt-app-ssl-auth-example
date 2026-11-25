import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { Database } from "@newt-app-ssl-auth-example/db";
import type { Organization, User } from "./user";
import type { UserRepository } from "./user.repository";

export const DATABASE = Symbol("Database");

/** Reads and writes better-auth's user, organization and member tables. */
@Injectable()
export class KyselyUserRepository implements UserRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findByDn(dn: string): Promise<User | null> {
    const row = await this.db
      .selectFrom("user")
      .select(["id", "name", "email"])
      .where("dn", "=", dn)
      .executeTakeFirst();
    return row ? { ...row, dn } : null;
  }

  async createOwner(user: User, organization: Organization): Promise<User> {
    const now = new Date();
    return this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto("user")
        .values({ ...user, emailVerified: true, image: null, createdAt: now, updatedAt: now })
        .execute();
      // Joins the organization if it already exists, e.g. when its owner was
      // removed but other members remain.
      const found = await trx
        .selectFrom("organization")
        .select("id")
        .where("slug", "=", organization.slug)
        .executeTakeFirst();
      const organizationId = found?.id ?? randomUUID();
      if (!found) {
        await trx
          .insertInto("organization")
          .values({
            id: organizationId,
            ...organization,
            logo: null,
            metadata: null,
            createdAt: now,
          })
          .execute();
      }
      await trx
        .insertInto("member")
        .values({
          id: randomUUID(),
          organizationId,
          userId: user.id,
          role: "owner",
          createdAt: now,
        })
        .execute();
      return user;
    });
  }
}
