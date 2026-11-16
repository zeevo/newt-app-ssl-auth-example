import type { BetterAuthClientPlugin } from "better-auth/client";
import type { sslAuth } from "./index.ts";

export function sslAuthClient() {
  return {
    id: "ssl",
    // SAFETY: a type-only marker that tells the client which server plugin's
    // endpoints to infer; better-auth never reads its value.
    $InferServerPlugin: {} as ReturnType<typeof sslAuth>,
    pathMethods: { "/sign-in/ssl": "POST" },
    getActions: ($fetch) => ({
      /**
       * Adds a user by certificate DN (admins only). The server looks up their
       * name and email in the user directory.
       */
      createCertificateUser: (dn: string, role: "admin" | "user") =>
        $fetch<{ user: { id: string; name: string } }>("/admin/create-user", {
          method: "POST",
          body: { role, data: { dn } },
        }),
    }),
    atomListeners: [{ matcher: (path) => path === "/sign-in/ssl", signal: "$sessionSignal" }],
  } satisfies BetterAuthClientPlugin;
}
