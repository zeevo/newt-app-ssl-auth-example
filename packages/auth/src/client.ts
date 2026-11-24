import type { BetterAuthClientPlugin } from "better-auth/client";
import type { sslAuth } from "./ssl-auth.ts";

export { hasRole, roles, type Role } from "./roles.ts";
export { slugify } from "./slug.ts";

/**
 * Infers the ssl plugin's endpoints: `signIn.ssl()`,
 * `organization.addCertificateMember()` and
 * `organization.listCertificateMembers()`. Use with `organizationClient()`,
 * whose listeners refresh the active organization after either organization
 * call.
 */
export function sslAuthClient() {
  return {
    id: "ssl",
    // SAFETY: a type-only marker that tells the client which server plugin's
    // endpoints to infer; better-auth never reads its value.
    $InferServerPlugin: {} as ReturnType<typeof sslAuth>,
    pathMethods: {
      "/sign-in/ssl": "POST",
      "/organization/add-certificate-member": "POST",
    },
    atomListeners: [{ matcher: (path) => path === "/sign-in/ssl", signal: "$sessionSignal" }],
  } satisfies BetterAuthClientPlugin;
}
