import { createDatabase } from "@newt-app-ssl-auth-example/db";
import { createAuth } from "./index.ts";

// Only read by the better-auth CLI (generate / migrate) for the schema. The app
// builds its instance in apps/api, where Nest supplies the real callbacks.
export const auth = createAuth(
  {
    database: createDatabase(process.env.DATABASE_URL ?? ""),
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  },
  { authenticate: async () => null, lookup: async () => null },
);
