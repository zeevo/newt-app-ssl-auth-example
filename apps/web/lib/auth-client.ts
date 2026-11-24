import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { sslAuthClient } from "@newt-app-ssl-auth-example/auth/client";

export const authClient = createAuthClient({ plugins: [sslAuthClient(), organizationClient()] });
