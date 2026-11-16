import { createAuth } from "./index.ts";

// Only read by the better-auth CLI (generate / migrate) for the schema. The app
// builds its instance in apps/api, where Nest supplies the real callbacks.
export const auth = createAuth({ authenticate: async () => null, lookup: async () => null });
