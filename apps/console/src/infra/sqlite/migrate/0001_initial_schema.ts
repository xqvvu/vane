import {
  createBetterAuthIndexes,
  createBetterAuthTables,
} from "#/infra/sqlite/migrate/better-auth.schema";
import { createAppIndexes, createAppTables } from "#/infra/sqlite/migrate/schema";
import { defineSqliteMigration } from "#/infra/sqlite/migrate/types";
import type { SqliteDatabaseSchema } from "#/infra/sqlite/schema";

export default defineSqliteMigration<SqliteDatabaseSchema>({
  version: "0001",
  name: "initial schema",
  filename: "0001_initial_schema.ts",
  async up(db) {
    await createAppTables(db);
    await createBetterAuthTables(db);
    await createAppIndexes(db);
    await createBetterAuthIndexes(db);
  },
});
