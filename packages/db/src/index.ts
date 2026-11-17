import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { DB } from "./schema.js";

// Connects lazily, on the first query, so importing this package (during a
// build, or in unit tests) needs no running database.
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool }),
});

export type Database = Kysely<DB>;

// Re-exported so apps that depend on this package can write raw SQL without
// depending on kysely themselves.
export { sql } from "kysely";

export type * from "./schema.js";
