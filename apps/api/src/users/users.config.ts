import { z } from "zod";

export const USERS_CONFIG = Symbol("UsersConfig");

const schema = z.object({
  NODE_ENV: z.string().optional(),
  USER_SERVICE: z.enum(["certificate", "devin"]).default("certificate"),
  DN_HEADER: z.string().min(1).default("x-dn"),
  INITIAL_ADMIN_DN: optional(z.string().trim().min(1)),
  INITIAL_ADMIN_NAME: optional(z.string().trim().min(1)),
  INITIAL_ADMIN_EMAIL: optional(z.email()),
});

// Unset and empty (e.g. `${INITIAL_ADMIN_DN:-}` in compose) mean the same.
function optional<T extends z.ZodType>(type: T) {
  return z.preprocess((value) => (value === "" ? undefined : value), type.optional());
}

export interface InitialAdmin {
  dn: string;
  name: string;
  email: string;
}

export interface UsersConfig {
  userService: "certificate" | "devin";
  dnHeader: string;
  /** Admin created on startup if no user has this DN yet. */
  initialAdmin: InitialAdmin | null;
}

export function loadUsersConfig(env: NodeJS.ProcessEnv): UsersConfig {
  const parsed = schema.parse(env);
  if (parsed.USER_SERVICE === "devin" && parsed.NODE_ENV === "production") {
    throw new Error("USER_SERVICE=devin is not allowed when NODE_ENV=production");
  }
  const { INITIAL_ADMIN_DN: dn, INITIAL_ADMIN_NAME: name, INITIAL_ADMIN_EMAIL: email } = parsed;
  if ((dn || name || email) && !(dn && name && email)) {
    throw new Error(
      "INITIAL_ADMIN_DN, INITIAL_ADMIN_NAME and INITIAL_ADMIN_EMAIL must be set together",
    );
  }
  return {
    userService: parsed.USER_SERVICE,
    dnHeader: parsed.DN_HEADER,
    initialAdmin: dn && name && email ? { dn, name, email } : null,
  };
}
