import { z } from "zod";

export const USERS_CONFIG = Symbol("UsersConfig");

const schema = z.object({
  NODE_ENV: z.string().optional(),
  USER_SERVICE: z.enum(["certificate", "devin"]).default("certificate"),
  DN_HEADER: z.string().min(1).default("x-dn"),
});

export interface UsersConfig {
  userService: "certificate" | "devin";
  dnHeader: string;
}

export function loadUsersConfig(env: NodeJS.ProcessEnv): UsersConfig {
  const parsed = schema.parse(env);
  if (parsed.USER_SERVICE === "devin" && parsed.NODE_ENV === "production") {
    throw new Error("USER_SERVICE=devin is not allowed when NODE_ENV=production");
  }
  return { userService: parsed.USER_SERVICE, dnHeader: parsed.DN_HEADER };
}
