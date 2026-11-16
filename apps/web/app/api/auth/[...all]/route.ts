import { AUTH } from "@newt-app-ssl-auth-example/api";
import type { Auth } from "@newt-app-ssl-auth-example/auth";
import { inject } from "@/lib/nest";

// better-auth is a Nest provider so its SSL sign-in uses whichever UserService
// the environment binds.
async function handler(request: Request) {
  const auth = await inject<Auth>(AUTH);
  return auth.handler(request);
}

export { handler as GET, handler as POST };
