import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import type { Database } from "@newt-app-ssl-auth-example/db";
import { sslAuth, type Organizations, type SslAuthOptions } from "./ssl-auth.ts";

export type { DirectoryEntry, Membership, SslAuthOptions } from "./ssl-auth.ts";
export { hasRole, roles, type Role } from "./roles.ts";
export { slugify } from "./slug.ts";

export interface AuthOptions {
  database: Database;
  /** The app's public origin, the only one better-auth accepts requests from. */
  baseURL: string;
  /** Signs sessions. Optional only for the CLI, which never signs anything. */
  secret?: string;
}

export function createAuth(options: AuthOptions, ssl: SslAuthOptions) {
  const db = options.database;
  const organizations: Organizations = {
    canAddMembers: async (headers, organizationId) => {
      try {
        const result = await auth.api.hasPermission({
          headers,
          body: { organizationId, permissions: { member: ["create"] } },
        });
        return result.success;
      } catch {
        return false;
      }
    },
    addMember: async (userId, organizationId, role) => {
      // Server-only: the organization plugin trusts the caller, so the ssl
      // plugin checks permissions before calling it.
      const member = await auth.api.addMember({ body: { userId, organizationId, role } });
      if (!member) throw new Error("The organization plugin did not add the member");
      return member;
    },
    removeUsersWithoutOrganization: async () => {
      // Their sessions, accounts and invitations go with them (ON DELETE CASCADE).
      await db
        .deleteFrom("user")
        .where(({ not, exists, selectFrom }) =>
          not(exists(selectFrom("member").select("id").whereRef("member.userId", "=", "user.id"))),
        )
        .execute();
    },
  };

  const auth = betterAuth({
    database: { db, type: "postgres" },
    baseURL: options.baseURL,
    secret: options.secret,
    // No sign-up or password sign-in: organization owners and admins add
    // people, who sign in only with a client certificate.
    emailAndPassword: { enabled: false },
    advanced: { database: { validateSchema: !process.env.AUTH_CLI } },
    databaseHooks: {
      session: {
        create: {
          // Every user belongs to an organization, so start each session in
          // the one they joined first.
          before: async (session) => {
            const membership = await db
              .selectFrom("member")
              .select("organizationId")
              .where("userId", "=", session.userId)
              .orderBy("createdAt")
              .limit(1)
              .executeTakeFirst();
            return {
              data: { ...session, activeOrganizationId: membership?.organizationId ?? null },
            };
          },
        },
      },
    },
    // Roles live on memberships: each organization has its own owners, admins
    // and members, and the organization plugin's endpoints check them on the
    // server.
    plugins: [sslAuth(ssl, organizations), organization()],
  });
  return auth;
}

export type Auth = ReturnType<typeof createAuth>;
