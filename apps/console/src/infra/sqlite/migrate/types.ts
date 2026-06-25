import type { Kysely } from "kysely";

export type SqliteMigrationDb<Schema extends object> = Kysely<Schema>;

interface TypedSqliteMigration<Schema extends object> {
  version: string;
  name: string;
  filename: string;
  up: (db: SqliteMigrationDb<Schema>) => Promise<void>;
}

export interface SqliteMigration {
  version: string;
  name: string;
  filename: string;
  up: (db: SqliteMigrationDb<Record<string, never>>) => Promise<void>;
}

export interface MigrationResult {
  applied: SqliteMigration[];
  skipped: SqliteMigration[];
}

export function defineSqliteMigration<Schema extends object>(
  migration: TypedSqliteMigration<Schema>,
): SqliteMigration {
  return migration as unknown as SqliteMigration;
}
