import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint, createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { setSessionCookie } from "better-auth/cookies";
import { driver } from "@newt-app-ssl-auth-example/db";
import { z } from "zod";

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

const createUserBody = z.looseObject({
  data: z.looseObject({ dn: z.string().trim().min(1) }),
});

/** Whether the caller behind these request headers may create users. */
export type CanCreateUsers = (headers: Headers) => Promise<boolean>;

const placeholder = { name: "pending", email: "pending@users.invalid" };

/**
 * Client certificate (mTLS) sign-in. The TLS handshake happens at the reverse
 * proxy, which forwards the verified certificate's DN in a request header;
 * `authenticate` decides who that is and this plugin opens a session for them.
 *
 * Admins add users by DN alone, through the admin plugin's create-user; the
 * name and email come from `lookup`.
 */
export function sslAuth(options: SslAuthOptions, canCreateUsers: CanCreateUsers) {
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
      before: [
        {
          // Fills in create-user's name and email from the directory, so
          // callers send only a DN; anything else sent for them is ignored.
          // This runs before create-user's own permission check, so it checks
          // first: callers who may not create users get placeholders and the
          // admin plugin's usual 401/403, never a lookup or a hint about which
          // DNs exist. It also runs outside create-user's transaction, so a
          // slow directory never holds the database.
          matcher: (ctx) => ctx.path === "/admin/create-user",
          handler: createAuthMiddleware(async (ctx) => {
            const body = createUserBody.safeParse(ctx.body);
            if (!body.success) {
              throw new APIError("BAD_REQUEST", { message: "A certificate DN is required" });
            }
            if (!ctx.headers || !(await canCreateUsers(ctx.headers))) {
              return { context: { body: { ...body.data, ...placeholder } } };
            }
            const { dn } = body.data.data;
            const taken = await ctx.context.adapter.findOne({
              model: "user",
              where: [{ field: "dn", value: dn }],
            });
            if (taken) {
              throw new APIError("BAD_REQUEST", { message: "A user with this DN already exists" });
            }
            const entry = await options.lookup(dn);
            if (!entry) {
              throw new APIError("BAD_REQUEST", { message: "No directory entry for this DN" });
            }
            return { context: { body: { ...body.data, name: entry.name, email: entry.email } } };
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
    },
  } satisfies BetterAuthPlugin;
}

export function createAuth(ssl: SslAuthOptions) {
  // The permission check needs the finished instance, so bind it afterwards.
  let canCreateUsers: CanCreateUsers = async () => false;
  const auth = betterAuth({
    database: driver,
    // No sign-up or password sign-in: admins add users, who sign in only with
    // a client certificate.
    emailAndPassword: { enabled: false },
    trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
    advanced: { database: { validateSchema: !process.env.AUTH_CLI } },
    // Roles: admins manage users through the admin plugin's endpoints, which
    // check the caller's role on the server.
    plugins: [sslAuth(ssl, (headers) => canCreateUsers(headers)), admin()],
  });
  canCreateUsers = async (headers) => {
    try {
      const result = await auth.api.userHasPermission({
        headers,
        body: { permissions: { user: ["create"] } },
      });
      return result.success;
    } catch {
      return false;
    }
  };
  return auth;
}

export type Auth = ReturnType<typeof createAuth>;
