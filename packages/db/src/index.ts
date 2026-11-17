import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { DB } from "./schema.js";

/**
 * A Kysely instance over a Postgres pool. It connects lazily, on the first
 * query, so creating one (during a build, or in unit tests) needs no running
 * database.
 */
export function createDatabase(connectionString: string): Database {
  return new Kysely<DB>({
    dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString }) }),
  });
}

export type Database = Kysely<DB>;

// Re-exported so apps that depend on this package can write raw SQL without
// depending on kysely themselves.
export { sql } from "kysely";

export type * from "./schema.js";
