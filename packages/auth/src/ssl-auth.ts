import type { BetterAuthPlugin } from "better-auth";
import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
  sessionMiddleware,
} from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import { hasRole, roles, type Role } from "./roles.ts";

export interface DirectoryEntry {
  name: string;
  email: string;
}

export interface SslAuthOptions {
  /**
   * Resolves the id of the user presenting the client certificate described by
   * these request headers, or null if they are not allowed in.
   */
  authenticate(headers: Headers): Promise<string | null>;
  /**
   * Looks up a person's name and email by certificate DN, or null if the
   * directory does not know the DN.
   */
  lookup(dn: string): Promise<DirectoryEntry | null>;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
}

/**
 * What this plugin needs from the organization plugin and the database. They
 * need the finished auth instance, so createAuth supplies them.
 */
export interface Organizations {
  canAddMembers(headers: Headers, organizationId: string): Promise<boolean>;
  addMember(userId: string, organizationId: string, role: Role): Promise<Membership>;
  removeUsersWithoutOrganization(): Promise<void>;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  dn?: string | null;
}

const addMemberBody = z.object({
  dn: z.string().trim().min(1, "A certificate DN is required"),
  role: z.enum(roles),
  organizationId: z.string().min(1),
});

const listMembersQuery = z.object({ organizationId: z.string().min(1) });

// Every way a membership can end. Belonging to an organization is what lets
// someone in, so whoever is left without one is deleted.
const membershipEndingPaths = new Set([
  "/organization/remove-member",
  "/organization/leave",
  "/organization/delete",
]);

const notAllowed = "You are not allowed to add members to this organization";

/**
 * Client certificate (mTLS) sign-in, on top of the organization plugin. The
 * TLS handshake happens at the reverse proxy, which forwards the verified
 * certificate's DN in a request header; `authenticate` decides who that is and
 * this plugin opens a session for them.
 *
 * Organization owners and admins add members by DN alone. A DN with no user
 * yet becomes one, with the name and email `lookup` finds; someone removed
 * from their last organization is deleted, which signs them out.
 */
export function sslAuth(options: SslAuthOptions, organizations: Organizations) {
  return {
    id: "ssl",
    schema: {
      user: {
        fields: {
          dn: { type: "string", required: false, unique: true, input: false },
        },
      },
    },
    hooks: {
      after: [
        {
          matcher: (ctx) => membershipEndingPaths.has(ctx.path ?? ""),
          handler: createAuthMiddleware(async () => {
            await organizations.removeUsersWithoutOrganization();
          }),
        },
      ],
    },
    endpoints: {
      signInSsl: createAuthEndpoint("/sign-in/ssl", { method: "POST" }, async (ctx) => {
        const userId = ctx.headers ? await options.authenticate(ctx.headers) : null;
        if (!userId) {
          throw new APIError("UNAUTHORIZED", { message: "No recognized client certificate" });
        }
        const user = await ctx.context.internalAdapter.findUserById(userId);
        if (!user) {
          throw new APIError("UNAUTHORIZED", { message: "No recognized client certificate" });
        }
        const session = await ctx.context.internalAdapter.createSession(user.id);
        await setSessionCookie(ctx, { session, user });
        return ctx.json({ token: session.token, user });
      }),

      /**
       * Adds someone to an organization by certificate DN. The caller needs
       * the organization's member:create permission (owners and admins), and
       * only owners may add owners, as with update-member-role.
       */
      addCertificateMember: createAuthEndpoint(
        "/organization/add-certificate-member",
        { method: "POST", body: addMemberBody, requireHeaders: true, use: [sessionMiddleware] },
        async (ctx) => {
          const { dn, role, organizationId } = ctx.body;
          // Permission comes first, so callers who may not add members never
          // trigger a directory lookup or learn which DNs exist.
          if (!(await organizations.canAddMembers(ctx.headers, organizationId))) {
            throw new APIError("FORBIDDEN", { message: notAllowed });
          }
          if (role === "owner") {
            const caller = await ctx.context.adapter.findOne<Membership>({
              model: "member",
              where: [
                { field: "userId", value: ctx.context.session.user.id },
                { field: "organizationId", value: organizationId },
              ],
            });
            if (!caller || !hasRole(caller.role, "owner")) {
              throw new APIError("FORBIDDEN", { message: "Only owners can add owners" });
            }
          }

          const existing = await ctx.context.adapter.findOne<UserRow>({
            model: "user",
            where: [{ field: "dn", value: dn }],
          });
          if (existing) {
            const member = await organizations.addMember(existing.id, organizationId, role);
            return ctx.json({ member });
          }

          // Looked up before anything is written, so a slow directory never
          // holds the database.
          const entry = await options.lookup(dn);
          if (!entry) {
            throw new APIError("BAD_REQUEST", { message: "No directory entry for this DN" });
          }
          if (await ctx.context.internalAdapter.findUserByEmail(entry.email)) {
            throw new APIError("BAD_REQUEST", { message: "A user with this email already exists" });
          }
          const user = await ctx.context.internalAdapter.createUser(
            {
              name: entry.name,
              email: entry.email,
              emailVerified: true,
              dn,
            },
            { method: "certificate" },
          );
          try {
            const member = await organizations.addMember(user.id, organizationId, role);
            return ctx.json({ member });
          } catch (error) {
            // A user with no organization should not exist.
            await ctx.context.internalAdapter.deleteUser(user.id);
            throw error;
          }
        },
      ),

      /**
       * An organization's members with their certificate DNs, which the
       * organization plugin's own member lists leave out. Any member may call it.
       */
      listCertificateMembers: createAuthEndpoint(
        "/organization/list-certificate-members",
        { method: "GET", query: listMembersQuery, requireHeaders: true, use: [sessionMiddleware] },
        async (ctx) => {
          const { organizationId } = ctx.query;
          const members = await ctx.context.adapter.findMany<Membership>({
            model: "member",
            where: [{ field: "organizationId", value: organizationId }],
          });
          if (!members.some((member) => member.userId === ctx.context.session.user.id)) {
            throw new APIError("FORBIDDEN", {
              message: "You are not a member of this organization",
            });
          }
          const users = await ctx.context.adapter.findMany<UserRow>({
            model: "user",
            where: [{ field: "id", operator: "in", value: members.map((member) => member.userId) }],
          });
          const byId = new Map(users.map((user) => [user.id, user]));
          return ctx.json(
            members
              .flatMap((member) => {
                const user = byId.get(member.userId);
                if (!user) return [];
                const { id, name, email, dn } = user;
                return [{ ...member, user: { id, name, email, dn: dn ?? null } }];
              })
              .sort((a, b) => a.user.name.localeCompare(b.user.name)),
          );
        },
      ),
    },
  } satisfies BetterAuthPlugin;
}
