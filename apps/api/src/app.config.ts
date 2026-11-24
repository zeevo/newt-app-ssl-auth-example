import { z } from "zod";
import { slugify } from "@newt-app-ssl-auth-example/auth";
import type { Organization } from "./users/user";

export const APP_CONFIG = Symbol("AppConfig");

// Unset and empty (e.g. `${INITIAL_OWNER_DN:-}` in compose) mean the same.
function optional<T extends z.ZodType>(type: T) {
  return z.preprocess((value) => (value === "" ? undefined : value), type.optional());
}

const schema = z.object({
  NODE_ENV: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().min(1),
  USER_SERVICE: z.enum(["certificate", "devin"]).default("certificate"),
  DN_HEADER: z.string().min(1).default("x-dn"),
  INITIAL_OWNER_DN: optional(z.string().trim().min(1)),
  INITIAL_OWNER_NAME: optional(z.string().trim().min(1)),
  INITIAL_OWNER_EMAIL: optional(z.email()),
  INITIAL_ORGANIZATION: optional(z.string().trim().min(1)),
});

export interface InitialOwner {
  dn: string;
  name: string;
  email: string;
  organization: Organization;
}

/** Everything the app reads from the environment, validated once at startup. */
export interface AppConfig {
  databaseUrl: string;
  authUrl: string;
  authSecret: string;
  userService: "certificate" | "devin";
  dnHeader: string;
  /** Owner created on startup, with their organization, if no user has this DN yet. */
  initialOwner: InitialOwner | null;
}

export function loadAppConfig(env: NodeJS.ProcessEnv): AppConfig {
  const parsed = schema.parse(env);
  if (parsed.USER_SERVICE === "devin" && parsed.NODE_ENV === "production") {
    throw new Error("USER_SERVICE=devin is not allowed when NODE_ENV=production");
  }
  const {
    INITIAL_OWNER_DN: dn,
    INITIAL_OWNER_NAME: name,
    INITIAL_OWNER_EMAIL: email,
    INITIAL_ORGANIZATION: organization,
  } = parsed;
  if ((dn || name || email || organization) && !(dn && name && email && organization)) {
    throw new Error(
      "INITIAL_OWNER_DN, INITIAL_OWNER_NAME, INITIAL_OWNER_EMAIL and INITIAL_ORGANIZATION must be set together",
    );
  }
  const slug = organization ? slugify(organization) : "";
  if (organization && !slug) {
    throw new Error("INITIAL_ORGANIZATION needs at least one letter or digit");
  }
  return {
    databaseUrl: parsed.DATABASE_URL,
    authUrl: parsed.BETTER_AUTH_URL,
    authSecret: parsed.BETTER_AUTH_SECRET,
    userService: parsed.USER_SERVICE,
    dnHeader: parsed.DN_HEADER,
    initialOwner:
      dn && name && email && organization
        ? { dn, name, email, organization: { name: organization, slug } }
        : null,
  };
}
